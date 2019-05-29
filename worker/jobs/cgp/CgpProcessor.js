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
      const history = await this.processHistory(nodeHistory);
      const current = this.processCurrent(nodeCurrent);
      const shouldProcessCurrent = this.shouldProcessCurrent({ current, history });

      // delete all intervals in the processed history and recreate them as finished
      const historyIntervalNumbers = R.map(R.path(['interval', 'interval']), history);
      intervalsDAL.bulkDeleteIntervals(historyIntervalNumbers, this.dbTransaction);
      // map each history element into a promise which creates the interval and votes
      const historyIntervalsPromises = history.map(element => this.createIntervalAndVotes(element));
      await Promise.all(historyIntervalsPromises);

      // current
      if (shouldProcessCurrent) {
        await this.upsertIntervalAndVotes(current);
      }

      const processedIntervals = history.length + (shouldProcessCurrent ? 1 : 0);
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
  async processHistory(history = []) {
    const latestFinishedInterval = R.pathOr(
      -1,
      ['interval'],
      await intervalsDAL.findLatestFinished()
    );
    const restFromHistory = R.slice(latestFinishedInterval + 1, Infinity, history);

    return R.map(element => this.parseNodeElement(element, 'finished'), restFromHistory);
  }

  processCurrent(current = {}) {
    return this.parseNodeElement(current, 'open');
  }

  /**
   * Returns true if current is not in history, otherwise false
   * both supplied properties should be the formatted ones and not the ones from the node
   */
  shouldProcessCurrent({ current, history } = {}) {
    const isCurrentInHistory = R.any(
      R.pathEq(['interval', 'interval'], current.interval.interval),
      history
    );
    return !isCurrentInHistory;
  }

  /**
   * Get an object with the relevant data for the database
   * @param {Object} element the element from the node
   * @param {string} status  the interval status to set
   */
  parseNodeElement(element, status) {
    const pathOrNull = R.pathOr(null);
    const pathOrEmptyArray = R.pathOr([]);

    const interval = {
      interval: getNodeInterval(element),
      resultAllocation: pathOrNull(['resultAllocation'], element),
      resultPayoutRecipient: pathOrNull(['resultPayout', 'recipient'], element),
      resultPayoutAmount: pathOrNull(['resultPayout', 'amount'], element),
      fund: pathOrNull(['fund'], element),
      status,
    };
    const allocation = R.compose(
      pathOrEmptyArray(['allocation', 'votes']),
      getFirstTally
    )(element);
    const payout = R.compose(
      pathOrEmptyArray(['payout', 'votes']),
      getFirstTally
    )(element);

    return {
      interval,
      allocation,
      payout,
    };
  }

  async createIntervalAndVotes(element) {
    const interval = await intervalsDAL.create(element.interval, {
      transaction: this.dbTransaction,
    });
    await this.createAllVotesForIntervalId(element, interval.id);
  }

  async upsertIntervalAndVotes(element) {
    let interval = await intervalsDAL.findByInterval(element.interval.interval);
    if (!interval) {
      interval = await intervalsDAL.create(element.interval, {
        transaction: this.dbTransaction,
      });
    }
    await this.deleteAllVotesByIntervalId(interval.id);
    await this.createAllVotesForIntervalId(element, interval.id);
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

function getFirstTally(element = {}) {
  try {
    return element.tallies[0] || {};
  } catch (e) {
    return {};
  }
}
function getNodeInterval(element = {}) {
  return getFirstTally(element).interval;
}
