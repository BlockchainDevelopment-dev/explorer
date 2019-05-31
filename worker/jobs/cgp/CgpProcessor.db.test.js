'use strict';

const test = require('blue-tape');
const td = require('testdouble');
const R = require('ramda');
const truncate = require('../../../test/lib/truncate');
const NetworkHelper = require('../../lib/NetworkHelper');
const currentData = require('./test/data/current.json');
const historyData = require('./test/data/history.json');
const currentData1 = require('./test/data/current.1.json');
const currentData1Updated = require('./test/data/current.1.1.json');
const historyData1 = require('./test/data/history.1.json');
const db = require('../../../server/db/sequelize/models');
const intervalsDAL = require('../../../server/components/api/cgp/intervals/dal');
const allocationDAL = require('../../../server/components/api/cgp/allocation/dal');
const payoutDAL = require('../../../server/components/api/cgp/payout/dal');

let cgpProcessor;

function before({ current = currentData, history = historyData } = {}) {
  const CgpProcessor = require('./CgpProcessor');
  const FakeNetworkHelper = td.constructor(NetworkHelper);
  td.when(FakeNetworkHelper.prototype.getCgpCurrent()).thenResolve(current);
  td.when(FakeNetworkHelper.prototype.getCgpHistory()).thenResolve(history);
  cgpProcessor = new CgpProcessor(new FakeNetworkHelper());
}
function after() {
  td.reset();
}
test.onFinish(() => {
  db.sequelize.close();
});

test('CgpProcessor.doJob() (DB)', async function(t) {
  await wrapTest('Given nothing in db', async given => {
    before();
    const result = await cgpProcessor.doJob();
    const expectedLength = historyData.length + 1;
    t.equal(result, expectedLength, `${given}: should process all intervals`);

    const intervalsCount = await intervalsDAL.count();
    t.equal(intervalsCount, expectedLength, `${given}: should have all intervals in db`);

    const openIntervals = await intervalsDAL.findAll({
      where: {
        status: 'open',
      },
    });
    t.equal(openIntervals.length, 1, `${given}: should have 1 open interval`);
    t.equal(
      openIntervals[0].interval,
      currentData.tallies[0].interval,
      `${given}: should have current as the open interval`
    );

    const interval0 = await intervalsDAL.findByInterval(0);
    t.equal(
      interval0.resultAllocation,
      5,
      `${given}: should have resultAllocation from the next interval (both in history)`
    );
    t.equal(
      interval0.fund,
      '25000000000',
      `${given}: should have fund from the next interval (both in history)`
    );

    after();
  });

  await wrapTest('Given some in db', async given => {
    before();
    // insert some intervals
    await intervalsDAL.bulkCreate([
      {
        interval: 0,
        resultPayoutRecipient: 'test0',
        status: 'finished',
      },
      {
        interval: 1,
        resultPayoutRecipient: 'test1',
        status: 'finished',
      },
    ]);
    await cgpProcessor.doJob();
    const expectedLength = historyData.length + 1;
    const intervalsCount = await intervalsDAL.count();
    t.equal(intervalsCount, expectedLength, `${given}: should have all intervals in db`);

    const test0 = await intervalsDAL.findAll({ where: { resultPayoutRecipient: 'test0' } });
    t.equal(test0.length, 1, `${given}: should not update the finished interval`);

    const open = await intervalsDAL.findAll({ where: { status: 'open' } });
    t.equal(open.length, 1, `${given}: should have 1 open interval`);
    after();
  });

  await wrapTest('Given all history in db with last open', async given => {
    before();
    // insert some intervals
    await intervalsDAL.bulkCreate([
      {
        interval: 0,
        status: 'finished',
      },
      {
        interval: 1,
        status: 'finished',
      },
      {
        interval: 2,
        status: 'open',
      },
    ]);
    await cgpProcessor.doJob();

    const interval2 = await intervalsDAL.findOne({ where: { interval: 2 } });
    t.assert(interval2.fund, `${given}: should update the open interval fund`);
    t.equal(interval2.status, 'finished', `${given}: should change the status to finished`);
    after();
  });

  await wrapTest('Given all in db with last open', async given => {
    before();
    // insert some intervals
    await intervalsDAL.bulkCreate([
      {
        interval: 0,
        status: 'finished',
      },
      {
        interval: 1,
        status: 'finished',
      },
      {
        interval: 2,
        status: 'finished',
      },
      {
        interval: 3,
        status: 'open',
      },
    ]);
    await cgpProcessor.doJob();

    const interval = await intervalsDAL.findOne({ where: { interval: 3 } });
    const allocationVotes = await allocationDAL.findAll({
      where: {
        CgpIntervalId: interval.id,
      },
    });
    t.assert(allocationVotes.length > 0, `${given}: should add votes to the open interval`);
    after();
  });

  await wrapTest('Given 2 updates', async given => {
    // initial data
    before();
    await cgpProcessor.doJob();
    const interval1Original = await intervalsDAL.findOne({ where: { interval: 1 } });
    after();

    // 1st update -----------------------------------------------------------------------------------
    await (async function firstUpdate() {
      before({ current: currentData1, history: historyData1 });
      await cgpProcessor.doJob();

      // check the amount of intervals
      t.equal(
        await intervalsDAL.count(),
        5,
        `${given}: after 1st update - should have one more interval`
      );

      // check that interval 1 is exactly the same
      t.deepEqual(
        interval1Original,
        await intervalsDAL.findOne({ where: { interval: 1 } }),
        `${given}: after 1st update - interval 1 should stay exactly the same`
      );

      // check that the previous current was finished and has the right amount of votes
      const interval3 = await intervalsDAL.findOne({ where: { interval: 3 } });
      t.equal(
        interval3.resultAllocation,
        0,
        `${given}: after 1st update - last history interval should have result from current interval`
      );
      t.equal(
        interval3.status,
        'finished',
        `${given}: after 1st update - should mark the last history interval as finished`
      );
      const allocationVotes = await allocationDAL.findAll({
        where: {
          CgpIntervalId: interval3.id,
        },
      });
      t.assert(
        allocationVotes.length === 1,
        `${given}: after 1st update - should have the end amount of votes`
      );
      t.equal(
        allocationVotes[0].zpCount,
        '1353500000000',
        `${given}: after 1st update - should have the right zpCount in the vote`
      );

      // check the open interval
      const interval4 = await intervalsDAL.findOne({ where: { interval: 4 } });
      t.equal(
        interval4.fund,
        '74000000000',
        `${given}: after 1st update - interval 4 (current) should have the fund`
      );
      t.equal(
        await allocationDAL.count({ where: { CgpIntervalId: interval4.id } }),
        0,
        `${given}: after 1st update - interval 4 (current) should have 0 allocation votes`
      );
      t.equal(
        await payoutDAL.count({ where: { CgpIntervalId: interval4.id } }),
        1,
        `${given}: after 1st update - interval 4 (current) should have 1 payout vote`
      );
      after();
    })();

    // second update ------------------------------------------------------------------------------------
    // history stays the same but current changes
    await (async function secondUpdate() {
      before({ current: currentData1Updated, history: historyData1 });
      await cgpProcessor.doJob();

      t.equal(
        await intervalsDAL.count(),
        5,
        `${given}: after 2nd update - should have the same amount of intervals`
      );
      t.equal(
        await intervalsDAL.count({ where: { status: 'open' } }),
        1,
        `${given}: after 2nd update - should have only 1 open interval`
      );

      const interval4 = await intervalsDAL.findOne({ where: { interval: 4 } });
      const allocationVotes = await allocationDAL.findAll({
        where: {
          CgpIntervalId: interval4.id,
        },
      });
      const payoutVotes = await payoutDAL.findAll({
        where: {
          CgpIntervalId: interval4.id,
        },
      });
      t.equal(
        allocationVotes.length,
        1,
        `${given}: after 2nd update - interval 4 (current) should have 1 allocation vote`
      );
      t.equal(
        payoutVotes.length,
        2,
        `${given}: after 2nd update - interval 4 (current) should have 2 payout votes`
      );
      t.assert(
        allocationVotes[0].zpCount === '100500000000' && allocationVotes[0].amount === 85,
        `${given}: after 2nd update - allocation vote should have the right data`
      );
      t.deepEqual(
        R.map(R.prop('recipient'), payoutVotes),
        [
          'tzn1qth9lf8atcusgz0hael2npraezuzhs48te9h5nnhudanpzj8pdvrseej4m6',
          'tzn1q799najjmsjqs97jx05calr9xfhmd7dqgdnalzds9wsxx8dv4ajtqmgaev2',
        ],
        `${given}: after 2nd update - payout votes should have the right data`
      );
      after();
    })();

    await wrapTest('Given empty tallies', async given => {
      before({
        current: {
          tallies: [
            {
              interval: 1,
              allocation: {
                votes: [
                  {
                    amount: 0,
                    count: 5000000000,
                  },
                ],
              },
              payout: {
                votes: [
                  {
                    recipient: 'tzn1qy2400evm8u40th7t96py7fqe2eq52u0thr5xy6jvsta25a26y4lsjaa7c4',
                    amount: 4000000000,
                    count: 5000000000,
                  },
                ],
              },
            },
          ],
          resultAllocation: 20,
          resultPayout: {},
          fund: 771000000000,
        },
        history: [
          {
            tallies: [],
            resultAllocation: 0,
            resultPayout: {},
            fund: 0,
          },
        ],
      });
      const result = await cgpProcessor.doJob();
      t.equal(result, 2, `${given}: should process all intervals`);

      const intervalsCount = await intervalsDAL.count();
      t.equal(intervalsCount, 2, `${given}: should have all intervals in db`);

      const openIntervals = await intervalsDAL.findAll({
        where: {
          status: 'open',
        },
      });
      t.equal(openIntervals.length, 1, `${given}: should have 1 open interval`);
      t.equal(openIntervals[0].interval, 1, `${given}: should have current as the open interval`);

      const interval0 = await intervalsDAL.findByInterval(0);
      t.equal(
        interval0.resultAllocation,
        20,
        `${given}: should have resultAllocation from the next interval`
      );
      t.equal(interval0.fund, '771000000000', `${given}: should have fund from the next interval`);

      after();
    });

    await wrapTest('Given future votes only', async given => {
      before({
        current: {
          tallies: [
            {
              interval: 11,
              allocation: {
                votes: [
                  {
                    amount: 0,
                    count: 5000000000,
                  },
                ],
              },
              payout: {
                votes: [
                  {
                    recipient: 'tzn1qy2400evm8u40th7t96py7fqe2eq52u0thr5xy6jvsta25a26y4lsjaa7c4',
                    amount: 4000000000,
                    count: 5000000000,
                  },
                ],
              },
            },
          ],
          resultAllocation: 20,
          resultPayout: {},
          fund: 771000000000,
        },
        history: [
          {
            tallies: [
              {
                interval: 23,
                allocation: {
                  votes: [
                    {
                      amount: 0,
                      count: 5000000000,
                    },
                  ],
                },
                payout: {
                  votes: [
                    {
                      recipient: 'tzn1qy2400evm8u40th7t96py7fqe2eq52u0thr5xy6jvsta25a26y4lsjaa7c4',
                      amount: 4000000000,
                      count: 5000000000,
                    },
                  ],
                },
              },
            ],
            resultAllocation: 0,
            resultPayout: {},
            fund: 0,
          },
        ],
      });
      await cgpProcessor.doJob();

      const intervalsCount = await intervalsDAL.count();
      t.equal(intervalsCount, 2, `${given}: should have all intervals in db`);

      const allocationVotes = await allocationDAL.count();
      t.equal(allocationVotes, 0, `${given}: should have 0 allocation votes in db`);

      const payoutVotes = await payoutDAL.count();
      t.equal(payoutVotes, 0, `${given}: should have 0 payout votes in db`);

      after();
    });
  });
});

async function wrapTest(given, test) {
  await truncate();
  await test(given);
}
