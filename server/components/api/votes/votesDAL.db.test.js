'use strict';

const test = require('blue-tape');
const truncate = require('../../../../test/lib/truncate');
const transactionsDAL = require('../transactions/transactionsDAL');
const blocksDAL = require('../blocks/blocksDAL');
const outputsDAL = require('../outputs/outputsDAL');
const contractsDAL = require('../contracts/contractsDAL');
const commandsDAL = require('../commands/commandsDAL');
const voteIntervalsDAL = require('../voteIntervals/voteIntervalsDAL');
const votesDAL = require('../votes/votesDAL');
const SnapshotsTaker = require('../../../../worker/jobs/snapshots/SnapshotsTaker');
const createDemoBlocksFromTo = require('../../../../test/lib/createDemoBlocksFromTo');
const faker = require('faker');

const CONTRACT_ID = '00000000e3113f8bf9cf8b764d945d6f99c642bdb069d137bdd5f7e44f1e75947f58a044';
const SNAPSHOT_BLOCK_CONTESTANT = 5;
const TALLY_BLOCK_CONTESTANT = 10;
const SNAPSHOT_BLOCK_CANDIDATE = 15;
const TALLY_BLOCK_CANDIDATE = 20;
const ADDRESS_AMOUNTS = {
  tzn11: '100' + '00000000' + '000000',
  tzn12: '101' + '00000000' + '000000',
  tzn13: '102' + '00000000' + '000000',
  tzn14: '311' + '00000000', // has less than 1,000,000 ZP
};

test('votesDAL.findAllByInterval() (DB)', async function(t) {
  await wrapTest('Given no votes', async given => {
    await createDemoData();
    const votes = await votesDAL.findAllByInterval({ interval: 1, phase: 'Contestant', limit: 1000, offset: 0 });
    t.equal(votes.length, 0, `${given}: should return an empty array`);
  });

  await wrapTest('Given 1 vote per address', async given => {
    await createDemoData();
    await addVoteForAll({ blockNumber: 6, phase: 'Contestant', commitId: '1' });

    const votes = await votesDAL.findAllByInterval({ interval: 1, phase: 'Contestant', limit: 1000, offset: 0 });
    t.equal(votes.length, 4, `${given}: should return 4 votes`);
  });

  await wrapTest('Given a double vote', async given => {
    await createDemoData();
    await addVoteForAll({ blockNumber: 6, commitId: '1' });
    await addVote({ address: 'tzn11', blockNumber: 7, commitId: '2' });

    const votes = await votesDAL.findAllByInterval({ interval: 1, phase: 'Contestant', limit: 1000, offset: 0 });
    t.equal(votes.length, 4, `${given}: should return 4 votes`);
    const hasSecondCommit = votes.some(item => item.commitId === '2');
    t.equal(hasSecondCommit, false, `${given}: should return the first vote`);
  });

  await wrapTest('Given a vote before the snapshot', async given => {
    await createDemoData();
    await addVote({ address: 'tzn11', blockNumber: 4, commitId: '1' });
    const votes = await votesDAL.findAllByInterval({ interval: 1, phase: 'Contestant', limit: 1000, offset: 0 });
    t.equal(votes.length, 0, `${given}: should not return the vote`);
  });

  await wrapTest('Given a vote at the tally block', async given => {
    await createDemoData();
    await addVote({ address: 'tzn11', blockNumber: 10, commitId: '1' });
    const votes = await votesDAL.findAllByInterval({ interval: 1, phase: 'Contestant', limit: 1000, offset: 0 });
    t.equal(votes.length, 0, `${given}: should not return the vote`);
  });
});

test('votesDAL.findAllVoteResults() (DB)', async function(t) {
  await wrapTest('Given no votes', async given => {
    await createDemoData();
    const results = await votesDAL.findAllVoteResults({ interval: 1, phase: 'Contestant', limit: 1000, offset: 0 });
    t.equal(results.length, 0, `${given}: should return an empty array`);
  });

  await wrapTest('Given 1 vote per address', async given => {
    await createDemoData();
    await addVoteForAll({ blockNumber: 6, commitId: '1' });

    const results = await votesDAL.findAllVoteResults({ interval: 1, phase: 'Contestant', limit: 1000, offset: 0 });
    t.equal(results.length, 1, `${given}: should return 1 result`);
    const result = results[0];
    t.equal(result.commitId, '1', `${given}: should have the right commitId`);
    t.equal(Number(result.zpAmount), 303000311, `${given}: should have a sum of the addresses' amount`);
  });

  await wrapTest('Given a double vote', async given => {
    await createDemoData();
    await addVoteForAll({ blockNumber: 6, commitId: '1' });
    await addVote({ address: 'tzn11', blockNumber: 7, commitId: '2' });

    const results = await votesDAL.findAllVoteResults({ interval: 1, phase: 'Contestant', limit: 1000, offset: 0 });
    t.equal(results.length, 1, `${given}: should return 1 result`);
    const result = results[0];
    t.equal(result.commitId, '1', `${given}: should have the right commitId`);
    t.equal(Number(result.zpAmount), 303000311, `${given}: should have a sum of the addresses' amount`);
  });

  await wrapTest('Given a vote before the snapshot', async given => {
    await createDemoData();
    await addVote({ address: 'tzn11', blockNumber: 4, commitId: '1' });
    const votes = await votesDAL.findAllVoteResults({ interval: 1, phase: 'Contestant', limit: 1000, offset: 0 });
    t.equal(votes.length, 0, `${given}: should not calculate the vote`);
  });

  await wrapTest('Given a vote at the tally block', async given => {
    await createDemoData();
    await addVote({ address: 'tzn11', blockNumber: 10, commitId: '1' });
    const votes = await votesDAL.findAllVoteResults({ interval: 1, phase: 'Contestant', limit: 1000, offset: 0 });
    t.equal(votes.length, 0, `${given}: should not calculate the vote`);
  });

  await wrapTest('Given each vote for different commit', async given => {
    await createDemoData();
    await addVote({ address: 'tzn11', blockNumber: 5, commitId: '1'});
    await addVote({ address: 'tzn12', blockNumber: 6, commitId: '2'});
    await addVote({ address: 'tzn13', blockNumber: 7, commitId: '3'});

    const results = await votesDAL.findAllVoteResults({ interval: 1, phase: 'Contestant', limit: 1000, offset: 0 });
    t.equal(results.length, 3, `${given}: should return a result per commit`);
    t.assert(
      results.every(item => {
        switch (item.commitId) {
          case '1':
            return ADDRESS_AMOUNTS.tzn11 / 100000000 === Number(item.zpAmount);
          case '2':
            return ADDRESS_AMOUNTS.tzn12 / 100000000 === Number(item.zpAmount);
          case '3':
            return ADDRESS_AMOUNTS.tzn13 / 100000000 === Number(item.zpAmount);
        }
        // in case something else
        return false;
      }),
      `${given}: should return the right amount per address`
    );
  });

  await wrapTest('Given some votes for different commits', async given => {
    await createDemoData();
    await addVote({ address: 'tzn11', blockNumber: 5, commitId: '1' });
    await addVote({ address: 'tzn12', blockNumber: 6, commitId: '1' });
    await addVote({ address: 'tzn13', blockNumber: 7, commitId: '2' });

    const results = await votesDAL.findAllVoteResults({ interval: 1, phase: 'Contestant', limit: 1000, offset: 0 });
    t.equal(results.length, 2, `${given}: should return a result per commit`);
  });
});

test('votesDAL.findContestantWinners() (DB)', async function(t) {
  await wrapTest('Given no votes', async given => {
    await createDemoData();
    const results = await votesDAL.findContestantWinners({ interval: 1 });
    t.equal(results.length, 0, `${given}: should return empty array`);
  });

  await wrapTest('Given all vote for same', async given => {
    await createDemoData();
    await addVoteForAll({ blockNumber: 6, commitId: '1' });

    const winners = await votesDAL.findContestantWinners({ interval: 1 });
    t.equal(winners.length, 1, `${given}: should have 1 winner`);
    t.equal(winners[0].commitId, '1', `${given}: commit '1' should win`);
    t.equal(Number(winners[0].zpAmount), 303000311, `${given}: Should have the sum of amounts`);
  });

  await wrapTest('Given each vote for different', async given => {
    await createDemoData();
    await addVote({ address: 'tzn11', blockNumber: 5, commitId: '1' });
    await addVote({ address: 'tzn12', blockNumber: 6, commitId: '2' });
    await addVote({ address: 'tzn13', blockNumber: 7, commitId: '3' });

    const winners = await votesDAL.findContestantWinners({ interval: 1 });
    t.equal(winners.length, 3, `${given}: should have 3 winners`);
  });

  await wrapTest('Given 2 commits', async given => {
    await createDemoData();
    await addVote({ address: 'tzn11', blockNumber: 5, commitId: '1' });
    await addVote({ address: 'tzn12', blockNumber: 6, commitId: '1' });
    await addVote({ address: 'tzn13', blockNumber: 7, commitId: '2' });

    const winners = await votesDAL.findContestantWinners({ interval: 1 });
    t.equal(winners.length, 2, `${given}: should have 2 winners`);
  });
});

test('votesDAL.findCandidateWinner() (DB)', async function(t) {
  await wrapTest('Given no votes', async given => {
    await createDemoData();
    const results = await votesDAL.findCandidateWinner({ interval: 1 });
    t.equal(results, null, `${given}: should return null`);
  });

  await wrapTest('Given all vote for same', async given => {
    await createDemoData();
    await addVoteForAll({ blockNumber: 16, commitId: '1' });

    const winner = await votesDAL.findCandidateWinner({ interval: 1 });
    t.equal(winner.commitId, '1', `${given}: commit '1' should win`);
    t.equal(Number(winner.zpAmount), 303000311, `${given}: Should have the sum of amounts`);
  });

  await wrapTest('Given each vote for different', async given => {
    await createDemoData();

    await addVote({ address: 'tzn11', blockNumber: 15, commitId: '1' });
    await addVote({ address: 'tzn12', blockNumber: 16, commitId: '2' });
    await addVote({ address: 'tzn13', blockNumber: 17, commitId: '3' });

    const winner = await votesDAL.findCandidateWinner({ interval: 1 });
    t.equal(winner.commitId, '3', `${given}: commit '3' should win`);
    t.equal(Number(winner.zpAmount), 102000000, `${given}: Should have the amount of the winner address`);
  });

  await wrapTest('Given 2 commits', async given => {
    await createDemoData();

    await addVote({ address: 'tzn11', blockNumber: 15, commitId: '1' });
    await addVote({ address: 'tzn12', blockNumber: 16, commitId: '1' });
    await addVote({ address: 'tzn13', blockNumber: 17, commitId: '2' });

    const winner = await votesDAL.findCandidateWinner({ interval: 1 });
    t.equal(winner.commitId, '1', `${given}: commit '1' should win`);
    t.equal(Number(winner.zpAmount), 201000000, `${given}: Should have the right sum`);
  });
});

test.onFinish(() => {
  blocksDAL.db.sequelize.close();
});

async function wrapTest(given, test) {
  await truncate();
  await test(given);
}

/**
 * Creates a range of blocks, some addresses with amount, an interval and take a snapshot
 */
async function createDemoData() {
  // create a range of blocks
  await createDemoBlocksFromTo(1, TALLY_BLOCK_CANDIDATE);
  const block1 = await blocksDAL.findByBlockNumber(1);
  // add amount to some addresses all in block 1
  for (let i = 0; i < Object.keys(ADDRESS_AMOUNTS).length; i++) {
    const address = Object.keys(ADDRESS_AMOUNTS)[i];
    const amount = ADDRESS_AMOUNTS[address];
    const tx = await transactionsDAL.create({
      index: i,
      version: 0,
      inputCount: 0,
      outputCount: 1,
      hash: faker.random.uuid(),
    });
    await outputsDAL.create({
      TransactionId: tx.id,
      lockType: 'PK',
      address,
      asset: '00',
      amount,
      index: 0,
    });

    await blocksDAL.addTransaction(block1, tx);
  }

  // add the voting contract
  await contractsDAL.create({
    id: CONTRACT_ID,
    address: 'ctzn1qqqqqqq8rzylch7w03dmym9zad7vuvs4akp5azdaa6hm7gnc7wk287k9qgssqskgv',
    code: '',
    expiryBlock: 1000,
  });

  // add the intervals
  const contestant = await voteIntervalsDAL.create({
    interval: 1,
    phase: 'Contestant',
    beginHeight: SNAPSHOT_BLOCK_CONTESTANT,
    endHeight: TALLY_BLOCK_CONTESTANT,
    thresholdZp: 1000000
  });
  await voteIntervalsDAL.create({
    interval: 1,
    phase: 'Candidate',
    beginHeight: SNAPSHOT_BLOCK_CANDIDATE,
    endHeight: TALLY_BLOCK_CANDIDATE,
    prevPhaseId: contestant.id,
  });

  const snapshotsTaker = new SnapshotsTaker({ chain: 'test' });
  await snapshotsTaker.doJob();
}

async function addVote({ address, commitId, blockNumber } = {}) {
  const block = await blocksDAL.findByBlockNumber(blockNumber);
  const contract = await contractsDAL.findById(CONTRACT_ID);
  const tx = await transactionsDAL.create({
    BlockId: block.id,
    index: 0,
    version: 0,
    inputCount: 0,
    outputCount: 1,
    hash: faker.random.uuid(),
  });
  const command = await commandsDAL.create({
    TransactionId: tx.id,
    ContractId: contract.id,
    command: '',
    messageBody: JSON.stringify({}),
    indexInTransaction: 0,
  });

  await votesDAL.create({
    CommandId: command.id,
    commitId,
    address,
  });
}

async function addVoteForAll({ commitId, blockNumber } = {}) {
  for (let i = 0; i < Object.keys(ADDRESS_AMOUNTS).length; i++) {
    const address = Object.keys(ADDRESS_AMOUNTS)[i];
    await addVote({ address, blockNumber, commitId });
  }
}
