const config = require('../../../../config/Config');

const configAfterTallyBlocks = config.get('cgp:afterTallyBlocks');
const configIntervalLength = config.get('cgp:intervalLength');
// number of blocks to show tally results
const AFTER_TALLY_BLOCKS = configAfterTallyBlocks ? Number(configAfterTallyBlocks) : 1000;
const INTERVAL_LENGTH = configIntervalLength ? Number(configIntervalLength) : 100;

module.exports = {
  AFTER_TALLY_BLOCKS,
  INTERVAL_LENGTH,
};
