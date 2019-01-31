const db = require('../../server/db/sequelize/models');
const truncate = require('../../worker/lib/truncate');
const blocks = require('./blocks.json');
const transactions = require('./transactions.json');
const inputs = require('./inputs.json');
const outputs = require('./outputs.json');

async function seed() {
  await truncate();
  await db.Block.bulkCreate(blocks);
  await db.Transaction.bulkCreate(transactions);
  await db.Output.bulkCreate(outputs);
  await db.Input.bulkCreate(inputs);
}

module.exports = seed;
