const intervalsDAL = require('../intervals/dal');
const getCurrentInterval = require('./getCurrentInterval');
const constants = require('./constants');

/**
 * Get an interval by:
 * 1. if interval is supplied, by that interval
 * 2. on going interval
 * 3. previous interval if we are below AFTER_TALLY_BLOCKS after it
 */
async function getCurrentCgpInterval(interval, currentBlock) {
  if (interval) {
    return intervalsDAL.findByInterval(interval);
  }
  if (!currentBlock) return null;

  const currentInterval = getCurrentInterval(currentBlock);
  const [current, prev] = await Promise.all([
    intervalsDAL.findByInterval(currentInterval),
    currentInterval > 0 ? intervalsDAL.findByInterval(currentInterval) : null,
  ]);
  const currentIntervalStartingBlock = currentInterval * constants.INTERVAL_LENGTH + 1;

  return prev && currentBlock - currentIntervalStartingBlock < constants.AFTER_TALLY_BLOCKS
    ? prev
    : current;
}

module.exports = getCurrentCgpInterval;
