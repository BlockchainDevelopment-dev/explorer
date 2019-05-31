const constants = require('./constants');

function getCurrentInterval(currentBlock) {
  return Math.floor((currentBlock - 1) / constants.INTERVAL_LENGTH);
}

module.exports = getCurrentInterval;
