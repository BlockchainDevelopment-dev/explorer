const CgpProcessor = require('./CgpProcessor');
const NetworkHelper = require('../../lib/NetworkHelper');

const cgpProcessor = new CgpProcessor(new NetworkHelper());

module.exports = async function(job) {
  return await cgpProcessor.doJob(job);
};
