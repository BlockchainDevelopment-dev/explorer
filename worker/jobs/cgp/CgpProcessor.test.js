'use strict';

const test = require('blue-tape');
const td = require('testdouble');
const R = require('ramda');
const NetworkHelper = require('../../lib/NetworkHelper');
const currentData = require('./test/data/current.json');
const historyData = require('./test/data/history.json');

let cgpProcessor;
let cgpIntervalsDAL;
let cgpAllocationVotesDAL;
let cgpPayoutVotesDAL;

function before() {
  cgpIntervalsDAL = td.replace('../../../server/components/api/cgp/intervals/dal.js', {
    findLatestFinished: td.func('findLatestFinished'),
    findByInterval: td.func('findByInterval'),
    create: td.func('create'),
    bulkDeleteIntervals: td.func('bulkDeleteIntervals'),
  });
  cgpAllocationVotesDAL = td.replace('../../../server/components/api/cgp/allocation/dal.js', {
    bulkDeleteByIntervalId: td.func('bulkDeleteByIntervalId'),
    create: td.func('create'),
    bulkCreate: td.func('bulkCreate'),
  });
  cgpPayoutVotesDAL = td.replace('../../../server/components/api/cgp/payout/dal.js', {
    bulkDeleteByIntervalId: td.func('bulkDeleteByIntervalId'),
    create: td.func('create'),
    bulkCreate: td.func('bulkCreate'),
  });

  const db = td.replace('../../../server/db/sequelize/models/index.js', {
    sequelize: td.object(['transaction']),
    Sequelize: td.object(),
  });
  td.when(db.sequelize.transaction()).thenResolve({ commit() {} });

  const CgpProcessor = require('./CgpProcessor');
  const FakeNetworkHelper = td.constructor(NetworkHelper);
  td.when(FakeNetworkHelper.prototype.getCgpCurrent()).thenResolve(currentData);
  td.when(FakeNetworkHelper.prototype.getCgpHistory()).thenResolve(historyData);
  cgpProcessor = new CgpProcessor(new FakeNetworkHelper());
}
function after() {
  td.reset();
}

test('VotesAdder.parseNodeElement()', async function(t) {
  await wrapTest('A current element', async given => {
    before();
    const result = cgpProcessor.parseNodeElement({
      tallies: [
        {
          interval: 3,
          allocation: {
            votes: [
              {
                amount: 0,
                count: 1353500000000,
              },
            ],
          },
          payout: {
            votes: [],
          },
        },
      ],
    });
    t.equal(result.interval.interval, 3, `${given}: Should have the right interval`);
    t.equal(result.allocation.length, 1, `${given}: Should have all the allocation votes`);
    t.equal(result.payout.length, 0, `${given}: Should have all the payout votes`);
    after();
  });

  await wrapTest('An element with more than 1 interval', async given => {
    before();
    const result = cgpProcessor.parseNodeElement({
      tallies: [
        {
          interval: 0,
          allocation: {
            votes: [
              {
                amount: 20,
                count: 5000000000,
              },
              {
                amount: 80,
                count: 10000000000,
              },
            ],
          },
          payout: {
            votes: [],
          },
        },
        {
          interval: 100,
          allocation: {
            votes: [
              {
                amount: 10,
                count: 50000000,
              },
            ],
          },
          payout: {
            votes: [],
          },
        },
      ],
      resultAllocation: 5,
      resultPayout: {},
      fund: 25000000000,
    });
    t.equal(result.interval.interval, 0, `${given}: Should have the first interval`);
    t.equal(result.interval.resultAllocation, 5, `${given}: Should have the resultAllocation`);
    t.equal(
      result.allocation.length,
      2,
      `${given}: Should have the allocation votes for the first interval`
    );
    t.equal(
      result.payout.length,
      0,
      `${given}: Should have the payout votes for the first interval`
    );
    after();
  });
});

test('VotesAdder.processHistory()', async function(t) {
  await wrapTest('No intervals in db', async given => {
    before();
    const result = await cgpProcessor.processHistory(historyData);
    t.equal(result.length, historyData.length, `${given}: Should have all the intervals`);
    after();
  });

  await wrapTest('Some intervals in db', async given => {
    before();
    td.when(cgpIntervalsDAL.findLatestFinished()).thenResolve({
      interval: 1,
    });
    const result = await cgpProcessor.processHistory(historyData);
    t.equal(
      result.length,
      historyData.length - 2,
      `${given}: Should have all the rest of the intervals`
    );
    t.equal(result[0].interval.interval, 2, `${given}: Should have 2 as the first interval`);
    after();
  });
});

test('VotesAdder.processCurrent()', async function(t) {
  await wrapTest('An interval', async given => {
    before();
    const result = cgpProcessor.processCurrent({
      tallies: [
        {
          interval: 3,
          allocation: {
            votes: [
              {
                amount: 0,
                count: 1353500000000,
              },
            ],
          },
          payout: {
            votes: [],
          },
        },
      ],
    });
    t.equal(result.interval.interval, 3, `${given}: Should have the interval`);
    after();
  });
});

test('VotesAdder.shouldProcessCurrent()', async function(t) {
  await wrapTest('Current is not in history', async given => {
    before();
    const result = await cgpProcessor.shouldProcessCurrent({
      current: { interval: { interval: 3 } },
      history: [
        { interval: { interval: 0 } },
        { interval: { interval: 1 } },
        { interval: { interval: 2 } },
      ],
    });
    t.equal(result, true, `${given}: Should return true`);
    after();
  });

  await wrapTest('Current is in history', async given => {
    before();
    const result = await cgpProcessor.shouldProcessCurrent({
      current: { interval: { interval: 3 } },
      history: [
        { interval: { interval: 0 } },
        { interval: { interval: 1 } },
        { interval: { interval: 2 } },
        { interval: { interval: 3 } },
      ],
    });
    t.equal(result, false, `${given}: Should return false`);
    after();
  });
});

test('VotesAdder.doJob()', async function(t) {
  await wrapTest('No intervals in db', async given => {
    before();
    td.when(cgpIntervalsDAL.findLatestFinished()).thenResolve(null);
    td.when(cgpIntervalsDAL.create(td.matchers.anything(), td.matchers.anything())).thenResolve({
      id: 1,
    });
    const result = await cgpProcessor.doJob({});
    t.equal(result, historyData.length + 1, `${given}: Should process all history and current`);

    try {
      td.verify(
        cgpIntervalsDAL.bulkDeleteIntervals(td.matchers.anything(), td.matchers.anything())
      );
      t.pass(`${given}: should call cgpIntervalsDAL.bulkDeleteIntervals`);
    } catch (error) {
      t.fail(`${given}: should call cgpIntervalsDAL.bulkDeleteIntervals`);
    }
    try {
      td.verify(cgpAllocationVotesDAL.bulkCreate(td.matchers.anything(), td.matchers.anything()));
      t.pass(`${given}: should call cgpAllocationVotesDAL.bulkCreate`);
    } catch (error) {
      t.fail(`${given}: should call cgpAllocationVotesDAL.bulkCreate`);
    }
    try {
      td.verify(cgpPayoutVotesDAL.bulkCreate(td.matchers.anything(), td.matchers.anything()));
      t.pass(`${given}: should call cgpPayoutVotesDAL.bulkCreate`);
    } catch (error) {
      t.fail(`${given}: should call cgpPayoutVotesDAL.bulkCreate`);
    }

    after();
  });

  await wrapTest('Some intervals in db', async given => {
    before();
    td.when(cgpIntervalsDAL.findLatestFinished()).thenResolve({interval: 1});
    td.when(cgpIntervalsDAL.create(td.matchers.anything(), td.matchers.anything())).thenResolve({
      id: 1,
    });
    const result = await cgpProcessor.doJob({});
    t.equal(result, historyData.length - 2 + 1, `${given}: Should process the difference in history and the current`);

    after();
  });

  await wrapTest('All history is in db', async given => {
    before();
    td.when(cgpIntervalsDAL.findLatestFinished()).thenResolve({interval: 2});
    td.when(cgpIntervalsDAL.create(td.matchers.anything(), td.matchers.anything())).thenResolve({
      id: 1,
    });
    const result = await cgpProcessor.doJob({});
    t.equal(result, 1, `${given}: Should process the difference in history and the current`);

    after();
  });
});

async function wrapTest(given, test) {
  await test(given);

  td.reset();
}
