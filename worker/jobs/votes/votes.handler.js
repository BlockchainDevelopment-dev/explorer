const BlockchainParser = require('../../../server/lib/BlockchainParser');
const getChain = require('../../../server/lib/getChain');
const QueueError = require('../../lib/QueueError');
const config = require('../../../server/config/Config');
const RepoVotesAdder = require('./VotesAdder');
const CGPVotesAdder = require('./CGPVotesAdder');

let repoVotesAdder;
let cgpVotesAdder;

/**
 * Handles both repo and cgp votes
 */
module.exports = async function(job) {
  if(job.data.type === 'repo') {
    // instantiate with the current chain
    if (!repoVotesAdder) {
      const chain = await getChain();
      if (chain) {
        // instantiate only if we have a chain
        repoVotesAdder = new RepoVotesAdder({
          blockchainParser: new BlockchainParser(chain),
          contractId: config.get('GOVERNANCE_CONTRACT_ID'),
        });
      }
    }
  
    if (repoVotesAdder) {
      return await repoVotesAdder.doJob(job);
    }
  }
  else if(job.data.type === 'cgp') {
    // instantiate with the current chain
    if (!cgpVotesAdder) {
      const chain = await getChain();
      if (chain) {
        // instantiate only if we have a chain
        cgpVotesAdder = new CGPVotesAdder({
          chain,
          blockchainParser: new BlockchainParser(chain),
          contractId: config.get('CGP_VOTING_CONTRACT_ID'),
        });
      }
    }
  
    if (cgpVotesAdder) {
      return await cgpVotesAdder.doJob(job);
    }
  }

  throw new QueueError(new Error('Could not start job - Chain is not available yet'));
};