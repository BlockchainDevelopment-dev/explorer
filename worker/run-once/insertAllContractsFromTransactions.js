/**
 * Go over the whole blockchain, search for contracts and insert them to the database
 * If the contract already exists - update it
 */
const contractsDAL = require('../../server/components/api/contracts/contractsDAL');
const BlocksAdder = require('../jobs/blocks/BlocksAdder');
const NetworkHelper = require('../lib/NetworkHelper');
const logger = require('../lib/logger');
const networkHelper = new NetworkHelper();
const blocksAdder = new BlocksAdder();

const run = async () => {
  const latestBlockNumberInNode = await networkHelper.getLatestBlockNumberFromNode();
  let contractsCount = 0;
  for (let i = 1; i <= latestBlockNumberInNode; i += 1) {
    // get block
    const nodeBlock = await networkHelper.getBlockFromNode(i);
    const transactionHashes = Object.keys(nodeBlock.transactions);
    logger.info(`search in block ${i}, in ${transactionHashes.length} txs`);
    for (let transactionIndex = 0; transactionIndex < transactionHashes.length; transactionIndex++) {
      const transactionHash = transactionHashes[transactionIndex];
      contractsCount += await blocksAdder.addContract({nodeBlock, transactionHash});
    }
  }
  return contractsCount;
};

run()
  .then((contractsCount) => {
    logger.info(`Finished adding contracts. Added ${contractsCount} contracts.`);
  })
  .catch(err => {
    logger.error(`An Error has occurred: ${err.message}`);
  })
  .then(() => {
    contractsDAL.db.sequelize.close();
  });
