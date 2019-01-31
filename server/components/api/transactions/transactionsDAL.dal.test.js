'use strict';

const test = require('blue-tape');
const seedTestDb = require('../../../../common/test/seedTestDb');
const blocksDAL = require('../blocks/blocksDAL');
const transactionsDAL = require('./transactionsDAL');

test.onFinish(() => {
  blocksDAL.db.sequelize.close();
});

async function wrapTest(given, test) {
  await test(given);
}

test('transactionsDAL.findAllAssetsByBlock()', async function(t) {
  // seed once only because there are no inserts or deletes here
  console.time('1');
  await seedTestDb();
  console.timeEnd('1');

  await wrapTest('Given a block with more than one lockType', async given => {
  });

});