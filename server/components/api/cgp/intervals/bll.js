'use strict';

const intervalsDAL = require('./dal');
const blocksBLL = require('../../blocks/blocksBLL');
const getCurrentCgpInterval = require('../lib/getCurrentCgpInterval');
const getCurrentInterval = require('../lib/getCurrentInterval');

module.exports = {
  findInterval: async function({ interval } = {}) {
    const currentBlock = await blocksBLL.latestBlockNumber();
    return getCurrentCgpInterval(interval, currentBlock);
  },
  findRecentIntervals: async function({ limit } = {}) {
    const currentInterval = getCurrentInterval(await blocksBLL.latestBlockNumber());
    return intervalsDAL.findAllRecent(currentInterval, limit);
  },
};
