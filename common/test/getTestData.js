const fs = require('fs');
const db = require('../../server/db/sequelize/models');

async function getData() {
  const NUM_OF_BLOCKS = 500;

  // blocks
  const blocks = await db.Block.findAll({
    limit: NUM_OF_BLOCKS,
    order: [['blockNumber', 'ASC']],
  });
  
  fs.writeFileSync(__dirname + '/blocks.json', JSON.stringify(blocks.map(block => block.toJSON())));
  console.log('Blocks file was saved!');

  // transactions
  const transactions = await db.Transaction.findAll({
    include: [
      {
        model: db.Block,
        attributes: [],
        where: {
          blockNumber: {
            [db.sequelize.Op.lte]: NUM_OF_BLOCKS,
          }
        }
      }
    ]
  });
  
  fs.writeFileSync(__dirname + '/transactions.json', JSON.stringify(transactions.map(tx => tx.toJSON())));
  console.log('Transactions file was saved!');

  // inputs
  const inputs = await db.Input.findAll({
    include: [
      {
        model: db.Transaction,
        attributes: [],
        required: true,
        include: [
          {
            model: db.Block,
            attributes: [],
            where: {
              blockNumber: {
                [db.sequelize.Op.lte]: NUM_OF_BLOCKS,
              }
            }
          }
        ]
      },
    ]
  });
  
  fs.writeFileSync(__dirname + '/inputs.json', JSON.stringify(inputs.map(input => input.toJSON())));
  console.log('Inputs file was saved!');

  // outputs
  const outputs = await db.Output.findAll({
    include: [
      {
        model: db.Transaction,
        attributes: [],
        required: true,
        include: [
          {
            model: db.Block,
            attributes: [],
            where: {
              blockNumber: {
                [db.sequelize.Op.lte]: NUM_OF_BLOCKS,
              }
            }
          }
        ]
      },
    ]
  });
  
  fs.writeFileSync(__dirname + '/outputs.json', JSON.stringify(outputs.map(output => output.toJSON())));
  console.log('Outputs file was saved!');
}

getData().then(() => {
  db.sequelize.close();
  console.log('finished');
});
