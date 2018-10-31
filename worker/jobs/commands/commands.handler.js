const ActiveContractsUpdater = require('./CommandsAdder');
const NetworkHelper = require('../../lib/NetworkHelper');
const activeContractsUpdater = new ActiveContractsUpdater(new NetworkHelper());

module.exports = async function (job) {
  return await activeContractsUpdater.doJob(job);
};