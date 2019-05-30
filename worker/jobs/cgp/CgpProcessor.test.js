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

test('CgpProcessor.parseNodeElement()', async function(t) {
  await wrapTest('An element with no votes', async given => {
    before();
    const result = cgpProcessor.parseNodeElement({
      status: 'open',
      interval: 2,
      element: {
        tallies: [],
        resultAllocation: 10,
        resultPayout: {
          recipient: 'tzn1qxp6ekp72q8903efylsnej34pa940cd2xae03l49pe7hkg3mrc26qyh2rgr',
          amount: 25000000000,
        },
        fund: 50000000000,
      },
    });
    t.equal(result.cgpInterval.interval, 2, `${given}: Should have the right interval`);
    t.assert(
      result.cgpInterval.resultAllocation === 10 &&
        result.cgpInterval.resultPayoutRecipient ===
          'tzn1qxp6ekp72q8903efylsnej34pa940cd2xae03l49pe7hkg3mrc26qyh2rgr' &&
        result.cgpInterval.resultPayoutAmount === 25000000000,
      `${given}: Should have the result data`
    );
    t.equal(
      result.allocation.length,
      0,
      `${given}: Should not have allocation votes of future intervals`
    );
    t.equal(result.payout.length, 0, `${given}: Should not have payout votes of future intervals`);
    after();
  });

  await wrapTest('A valid element', async given => {
    before();
    const result = cgpProcessor.parseNodeElement({
      status: 'open',
      interval: 2,
      element: {
        tallies: [
          {
            interval: 2,
            allocation: {
              votes: [
                {
                  amount: 0,
                  count: 858500000000,
                },
              ],
            },
            payout: {
              votes: [
                {
                  recipient: 'tzn1qxp6ekp72q8903efylsnej34pa940cd2xae03l49pe7hkg3mrc26qyh2rgr',
                  amount: 1000000000,
                  count: 853500000000,
                },
              ],
            },
          },
        ],
        resultAllocation: 10,
        resultPayout: {
          recipient: 'tzn1qxp6ekp72q8903efylsnej34pa940cd2xae03l49pe7hkg3mrc26qyh2rgr',
          amount: 25000000000,
        },
        fund: 50000000000,
      },
    });
    t.equal(result.cgpInterval.interval, 2, `${given}: Should have the right interval`);
    t.assert(
      result.cgpInterval.resultAllocation === 10 &&
        result.cgpInterval.resultPayoutRecipient ===
          'tzn1qxp6ekp72q8903efylsnej34pa940cd2xae03l49pe7hkg3mrc26qyh2rgr' &&
        result.cgpInterval.resultPayoutAmount === 25000000000,
      `${given}: Should have the result data`
    );
    t.equal(result.allocation.length, 1, `${given}: Should have all the allocation votes`);
    t.equal(result.payout.length, 1, `${given}: Should have all the payout votes`);
    after();
  });

  await wrapTest('An element with more than 1 interval', async given => {
    before();
    const result = cgpProcessor.parseNodeElement({
      status: 'finished',
      interval: 0,
      element: {
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
      },
    });
    t.equal(result.cgpInterval.interval, 0, `${given}: Should have the first interval`);
    t.equal(result.cgpInterval.resultAllocation, 5, `${given}: Should have the resultAllocation`);
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

  await wrapTest('An element with future votes only', async given => {
    before();
    const result = cgpProcessor.parseNodeElement({
      status: 'finished',
      interval: 2,
      element: {
        tallies: [
          {
            interval: 100,
            allocation: {
              votes: [
                {
                  amount: 0,
                  count: 858500000000,
                },
              ],
            },
            payout: {
              votes: [
                {
                  recipient: 'tzn1qxp6ekp72q8903efylsnej34pa940cd2xae03l49pe7hkg3mrc26qyh2rgr',
                  amount: 1000000000,
                  count: 853500000000,
                },
              ],
            },
          },
        ],
        resultAllocation: 10,
        resultPayout: {
          recipient: 'tzn1qxp6ekp72q8903efylsnej34pa940cd2xae03l49pe7hkg3mrc26qyh2rgr',
          amount: 25000000000,
        },
        fund: 50000000000,
      },
    });
    t.equal(result.cgpInterval.interval, 2, `${given}: Should have the right interval`);
    t.assert(
      result.cgpInterval.resultAllocation === 10 &&
        result.cgpInterval.resultPayoutRecipient ===
          'tzn1qxp6ekp72q8903efylsnej34pa940cd2xae03l49pe7hkg3mrc26qyh2rgr' &&
        result.cgpInterval.resultPayoutAmount === 25000000000,
      `${given}: Should have the result data`
    );
    t.equal(
      result.allocation.length,
      0,
      `${given}: Should not have allocation votes of future intervals`
    );
    t.equal(result.payout.length, 0, `${given}: Should not have payout votes of future intervals`);
    after();
  });
});

test('CgpProcessor.processNodeHistory()', async function(t) {
  await wrapTest('No intervals in db', async given => {
    before();
    const result = await cgpProcessor.processNodeHistory(historyData);
    t.equal(result.length, historyData.length, `${given}: Should have all the intervals`);
    after();
  });

  await wrapTest('Some intervals in db', async given => {
    before();
    td.when(cgpIntervalsDAL.findLatestFinished()).thenResolve({
      interval: 1,
    });
    const result = await cgpProcessor.processNodeHistory(historyData);
    t.equal(
      result.length,
      historyData.length - 2,
      `${given}: Should have all the rest of the intervals`
    );
    t.equal(result[0].cgpInterval.interval, 2, `${given}: Should have 2 as the first interval`);
    after();
  });
});

test('CgpProcessor.processNodeCurrent()', async function(t) {
  await wrapTest('Given no history', async given => {
    before();
    const result = cgpProcessor.processNodeCurrent({
      current: {
        tallies: [
          {
            interval: 0,
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
        resultAllocation: 0,
        resultPayout: {},
        fund: 0,
      },
      history: [],
    });
    t.equal(result.cgpInterval.interval, 0, `${given}: Should have interval 0`);
    after();
  });
  await wrapTest('Given history has 1 interval', async given => {
    before();
    const result = cgpProcessor.processNodeCurrent({
      current: {
        tallies: [
          {
            interval: 1,
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
        resultAllocation: 5,
        resultPayout: {},
        fund: 25000000000,
      },
      history: [
        {
          tallies: [
            {
              interval: 0,
              allocation: {
                votes: [],
              },
              payout: {
                votes: [],
              },
            },
          ],
          resultAllocation: 0,
          resultPayout: {},
          fund: 0,
        },
      ],
    });
    t.equal(result.cgpInterval.interval, 1, `${given}: Should have interval 1`);
    t.equal(result.allocation.length, 1, `${given}: Should have the relevant votes`);
    after();
  });

  await wrapTest('Given only future votes', async given => {
    before();
    const result = cgpProcessor.processNodeCurrent({
      current: {
        tallies: [
          {
            interval: 11,
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
        resultAllocation: 5,
        resultPayout: {},
        fund: 25000000000,
      },
      history: [],
    });
    t.equal(result.cgpInterval.interval, 0, `${given}: Should have the right interval`);
    t.equal(result.allocation.length, 0, `${given}: Should not contain votes`);
    after();
  });
});

test('CgpProcessor.shouldProcessCurrent()', async function(t) {
  await wrapTest('Current is not in history', async given => {
    before();
    const result = await cgpProcessor.shouldProcessCurrent({
      current: { cgpInterval: { interval: 3 } },
      history: [
        { cgpInterval: { interval: 0 } },
        { cgpInterval: { interval: 1 } },
        { cgpInterval: { interval: 2 } },
      ],
    });
    t.equal(result, true, `${given}: Should return true`);
    after();
  });

  await wrapTest('Current is in history', async given => {
    before();
    const result = await cgpProcessor.shouldProcessCurrent({
      current: { cgpInterval: { interval: 3 } },
      history: [
        { cgpInterval: { interval: 0 } },
        { cgpInterval: { interval: 1 } },
        { cgpInterval: { interval: 2 } },
        { cgpInterval: { interval: 3 } },
      ],
    });
    t.equal(result, false, `${given}: Should return false`);
    after();
  });
});

test('CgpProcessor.doJob()', async function(t) {
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
    td.when(cgpIntervalsDAL.findLatestFinished()).thenResolve({ interval: 1 });
    td.when(cgpIntervalsDAL.create(td.matchers.anything(), td.matchers.anything())).thenResolve({
      id: 1,
    });
    const result = await cgpProcessor.doJob({});
    t.equal(
      result,
      historyData.length - 2 + 1,
      `${given}: Should process the difference in history and the current`
    );

    after();
  });

  await wrapTest('All history is in db', async given => {
    before();
    td.when(cgpIntervalsDAL.findLatestFinished()).thenResolve({ interval: 2 });
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
