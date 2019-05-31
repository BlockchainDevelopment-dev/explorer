'use strict';

const R = require('ramda');
const logger = require('../../lib/logger')('cgp');
const QueueError = require('../../lib/QueueError');
const db = require('../../../server/db/sequelize/models');
const intervalsDAL = require('../../../server/components/api/cgp/intervals/dal');
const allocationDAL = require('../../../server/components/api/cgp/allocation/dal');
const payoutDAL = require('../../../server/components/api/cgp/payout/dal');

/**
 * Processes CGP intervals, allocation votes and payout votes
 */
class CgpProcessor {
  constructor(networkHelper) {
    this.networkHelper = networkHelper;
    this.dbTransaction = null;
  }

  async doJob() {
    try {
      this.dbTransaction = await db.sequelize.transaction();

      const [nodeHistory, nodeCurrent] = await Promise.all([
        this.networkHelper.getCgpHistory(),
        this.networkHelper.getCgpCurrent(),
      ]);
      const history = await this.processNodeHistory(nodeHistory);
      const current = this.processNodeCurrent({ current: nodeCurrent, history: nodeHistory });
      const historyRearranged = this.rearrangeResultsOfHistory({ current, history });
      const currentWithoutResults = R.assoc(
        'cgpInterval',
        R.pick(['interval', 'status', 'fund'], current.cgpInterval),
        current
      );
      const shouldProcessCurrent = this.shouldProcessCurrent({
        current: currentWithoutResults,
        history: historyRearranged,
      });

      // delete all intervals in the processed history and recreate them as finished
      const historyIntervalNumbers = R.map(R.path(['cgpInterval', 'interval']), historyRearranged);
      intervalsDAL.bulkDeleteIntervals(historyIntervalNumbers, this.dbTransaction);
      // map each history element into a promise which creates the interval and votes
      const historyIntervalsPromises = historyRearranged.map(element =>
        this.createIntervalAndVotes(element)
      );
      await Promise.all(historyIntervalsPromises);

      // current
      if (shouldProcessCurrent) {
        await this.upsertIntervalAndVotes(currentWithoutResults);
      }

      const processedIntervals = historyRearranged.length + (shouldProcessCurrent ? 1 : 0);
      logger.info(`Finished processing ${processedIntervals} intervals`);
      await this.dbTransaction.commit();
      return processedIntervals;
    } catch (error) {
      logger.error(`An Error has occurred when adding cgp votes: ${error.message}`);
      if (this.dbTransaction) {
        logger.info('Rollback the database transaction');
        await this.dbTransaction.rollback();
      }
      throw new QueueError(error);
    }
  }

  /**
   * Get history items for open or non existing database intervals
   * @param {Array} history
   */
  async processNodeHistory(history = []) {
    const latestFinishedInterval = R.pathOr(
      -1,
      ['interval'],
      await intervalsDAL.findLatestFinished()
    );
    const restFromHistory = R.slice(latestFinishedInterval + 1, Infinity, history);

    const mapIndexed = R.addIndex(R.map);
    return mapIndexed(
      (element, i) =>
        this.parseNodeElement({
          element,
          status: 'finished',
          interval: latestFinishedInterval + 1 + i,
        }),
      restFromHistory
    );
  }

  processNodeCurrent({ current = {}, history = [] } = {}) {
    return this.parseNodeElement({ element: current, status: 'open', interval: history.length });
  }

  /**
   * Moves each result to the previous element
   * In the node, each element contains the results for the previous interval
   * @returns a new history array in which each element has its own results
   */
  rearrangeResultsOfHistory({ current, history } = {}) {
    if (!current) throw new Error('current interval must be supplied');

    const removeFirst = R.slice(1, Infinity);
    const changeCurrentStatus = R.assocPath(['cgpInterval', 'status'], 'finished');
    const appendCurrent = R.append(changeCurrentStatus(current));
    const changeIntervalsToFitResultsAndRemoveVotes = R.map(element => ({
      cgpInterval: R.merge(element.cgpInterval, { interval: element.cgpInterval.interval - 1 }),
    }));
    const mergeToCurrentHistory = R.zipWith(R.merge, history);
    return R.compose(
      mergeToCurrentHistory,
      changeIntervalsToFitResultsAndRemoveVotes,
      appendCurrent,
      removeFirst
    )(history);
  }

  /**
   * Returns true if current is not in history, otherwise false
   * both supplied properties should be the formatted ones and not the ones from the node
   */
  shouldProcessCurrent({ current, history } = {}) {
    const isCurrentInHistory = R.any(
      R.pathEq(['cgpInterval', 'interval'], current.cgpInterval.interval),
      history
    );
    return !isCurrentInHistory;
  }

  /**
   * Parse the data from the node and get an object with the relevant data for the database
   */
  parseNodeElement({ element, status, interval } = {}) {
    const pathOrNull = R.pathOr(null);
    const pathOrEmptyArray = R.pathOr([]);

    const cgpInterval = {
      interval,
      resultAllocation: pathOrNull(['resultAllocation'], element),
      resultPayoutRecipient: pathOrNull(['resultPayout', 'recipient'], element),
      resultPayoutAmount: pathOrNull(['resultPayout', 'amount'], element),
      fund: pathOrNull(['fund'], element),
      status,
    };
    const allocation = R.compose(
      pathOrEmptyArray(['allocation', 'votes']),
      getTallyForInterval(interval)
    )(element);
    const payout = R.compose(
      pathOrEmptyArray(['payout', 'votes']),
      getTallyForInterval(interval)
    )(element);

    return {
      cgpInterval,
      allocation,
      payout,
    };
  }

  /**
   * Inserts data into the database
   *
   * @param {object} element the parsed object ready for the database
   */
  async createIntervalAndVotes(element) {
    const cgpInterval = await intervalsDAL.create(element.cgpInterval, {
      transaction: this.dbTransaction,
    });
    await this.createAllVotesForIntervalId(element, cgpInterval.id);
  }

  /**
   * Inserts data into the database
   * Uses an existing interval or creates one
   *
   * @param {object} element the parsed object ready for the database
   */
  async upsertIntervalAndVotes(element) {
    let cgpInterval = await intervalsDAL.findByInterval(element.cgpInterval.interval);
    if (!cgpInterval) {
      cgpInterval = await intervalsDAL.create(element.cgpInterval, {
        transaction: this.dbTransaction,
      });
    }
    await this.deleteAllVotesByIntervalId(cgpInterval.id);
    await this.createAllVotesForIntervalId(element, cgpInterval.id);
  }

  async deleteAllVotesByIntervalId(id) {
    return Promise.all([
      allocationDAL.bulkDeleteByIntervalId(id, this.dbTransaction),
      payoutDAL.bulkDeleteByIntervalId(id, this.dbTransaction),
    ]);
  }

  async createAllVotesForIntervalId(element, id) {
    const allocationVotes = R.map(
      vote => ({
        CgpIntervalId: id,
        amount: vote.amount,
        zpCount: vote.count,
      }),
      element.allocation
    );
    const payoutVotes = R.map(
      vote => ({
        CgpIntervalId: id,
        recipient: vote.recipient,
        amount: vote.amount,
        zpCount: vote.count,
      }),
      element.payout
    );
    return Promise.all([
      await allocationDAL.bulkCreate(allocationVotes, { transaction: this.dbTransaction }),
      await payoutDAL.bulkCreate(payoutVotes, { transaction: this.dbTransaction }),
    ]);
  }
}

module.exports = CgpProcessor;

function getTallyForInterval(interval) {
  return R.compose(
    R.defaultTo({}),
    R.find(R.propEq('interval', interval)),
    R.propOr([], 'tallies')
  );
}
