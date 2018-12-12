const blocksBLL = require('../api/blocks/blocksBLL');
const transactionsBLL = require('../api/transactions/transactionsBLL');
const addressesBLL = require('../api/addresses/addressesBLL');
const contractsBLL = require('../api/contracts/contractsBLL');

module.exports = async req => {
  const { routeName } = req;
  const initialState = {
    addressStore: {},
    assetStore: {},
    blockStore: {},
    contractStore: {},
    infoStore: {},
    searchStore: {},
    transactionStore: {},
    uiStore: {},
  };
  const promises = [];
  // blocks
  promises.push(blocksBLL.count().then(count => (initialState.blockStore.blocksCount = count)));

  switch (routeName) {
    case 'block':
      promises.push(getBlockStoreData(req).then(data => (initialState.blockStore = data)));
      break;
    case 'tx':
      promises.push(
        getTransactionStoreData(req).then(data => (initialState.transactionStore = data))
      );
      break;
    case 'address':
      promises.push(getAddressStoreData(req).then(data => (initialState.addressStore = data)));
      break;
    case 'contract':
      promises.push(getContractStoreData(req).then(data => (initialState.contractStore = data)));
      promises.push(getAddressStoreData(req).then(data => (initialState.addressStore = data)));
      break;
  }

  await Promise.all(promises);
  return initialState;
};

async function getBlockStoreData(req) {
  const hashOrBlockNumber = req.params.hashOrBlockNumber;
  const block = await blocksBLL.findByHashOrBlockNumber({ hashOrBlockNumber: hashOrBlockNumber });
  return {
    block,
    hashOrBlockNumber,
  };
}

async function getTransactionStoreData(req) {
  const transaction = await transactionsBLL.findOne({ hash: req.params.hash });
  return {
    transaction,
  };
}

async function getAddressStoreData(req) {
  const address = await addressesBLL.findOne({ address: req.params.address });
  return {
    address,
  };
}

async function getContractStoreData(req) {
  const contract = await contractsBLL.findByAddress({ address: req.params.address });
  return {
    contract,
  };
}
