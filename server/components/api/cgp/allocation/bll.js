'use strict';

const votesDAL = require('./dal');
const blocksBLL = require('../../blocks/blocksBLL');
const createQueryObject = require('../../../../lib/createQueryObject');
const getCurrentCgpInterval = require('../lib/getCurrentCgpInterval');

module.exports = {
  findAllVotesByInterval: async function({ interval, page = 0, pageSize = 10, sorted } = {}) {
    const currentBlock = await blocksBLL.latestBlockNumber();
    const currentCgpInterval = await getCurrentCgpInterval(interval, currentBlock);
    if (!currentCgpInterval) {
      return null;
    }

    // this is currently ignored
    const sortBy =
      sorted && sorted != '[]' ? JSON.parse(sorted) : [{ id: 'blockNumber', desc: true }];

    const query = Object.assign(
      {},
      { interval: currentCgpInterval.interval },
      createQueryObject({ page, pageSize, sorted: sortBy })
    );
    return await Promise.all([
      votesDAL.countByInterval({ interval: currentCgpInterval.interval }),
      votesDAL.findAllByInterval(query),
    ]).then(votesDAL.getItemsAndCountResult);
  },
};
