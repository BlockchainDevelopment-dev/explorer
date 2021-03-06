'use strict';

const tags = require('common-tags');
const dal = require('../../../lib/dal');
const db = require('../../../../server/db/sequelize/models');
const {
  WITH_FILTER_TABLES,
  FIND_ALL_BY_INTERVAL_BASE_SQL,
  FIND_ALL_VOTE_RESULTS_BASE_SQL,
} = require('./votesSql');

const sequelize = db.sequelize;
const votesDAL = dal.createDAL('RepoVote');

votesDAL.findAllUnprocessedCommands = async function(contractId) {
  const sql = tags.oneLine`
    SELECT *
    FROM "Commands" c
    WHERE c."ContractId" = :contractId 
    AND c.id NOT IN 
      (SELECT DISTINCT "CommandId"
      FROM "RepoVotes")
  `;

  return sequelize.query(sql, {
    replacements: {
      contractId,
    },
    type: sequelize.QueryTypes.SELECT,
  });
};
/**
 * Find all votes for an interval, grouped by command and filter double votes
 */
votesDAL.findAllByInterval = async function({ interval, limit, offset = 0 } = {}) {
  const sql = tags.oneLine`
  ${WITH_FILTER_TABLES}
  ${FIND_ALL_BY_INTERVAL_BASE_SQL}
  ORDER BY "Blocks"."blockNumber" DESC
  LIMIT :limit OFFSET :offset; 
  `;

  return sequelize.query(sql, {
    replacements: {
      interval,
      limit,
      offset,
    },
    type: sequelize.QueryTypes.SELECT,
  });
};

/**
 * Count all votes for an interval, grouped by command and filter double votes
 */
votesDAL.countByInterval = async function({ interval } = {}) {
  const sql = tags.oneLine`
  ${WITH_FILTER_TABLES}
  SELECT count(*) FROM (${FIND_ALL_BY_INTERVAL_BASE_SQL}) AS "Votes";
  `;

  return sequelize
    .query(sql, {
      replacements: {
        interval,
      },
      type: sequelize.QueryTypes.SELECT,
    })
    .then(this.queryResultToCount);
};

/**
 * Get the repo vote results for an interval
 * per address, get the vote that was done in the earliest block and earliest tx in it
 *
 * @param {number} interval
 */
votesDAL.findAllVoteResults = async function({ interval, limit, offset = 0 } = {}) {
  const sql = tags.oneLine`
  ${WITH_FILTER_TABLES}
  ${FIND_ALL_VOTE_RESULTS_BASE_SQL}
  ORDER BY "zpAmount" DESC
  LIMIT :limit OFFSET :offset;
  `;

  return sequelize.query(sql, {
    replacements: {
      interval,
      limit,
      offset,
    },
    type: sequelize.QueryTypes.SELECT,
  });
};

votesDAL.countAllVoteResults = async function({ interval } = {}) {
  const sql = tags.oneLine`
  ${WITH_FILTER_TABLES}
  SELECT count(*) FROM (${FIND_ALL_VOTE_RESULTS_BASE_SQL}) AS "Results"
  `;

  return sequelize
    .query(sql, {
      replacements: {
        interval,
      },
      type: sequelize.QueryTypes.SELECT,
    })
    .then(this.queryResultToCount);
};

votesDAL.findWinner = async function({ interval } = {}) {
  const sql = tags.oneLine`
  ${WITH_FILTER_TABLES}
  ${FIND_ALL_VOTE_RESULTS_BASE_SQL}
  ORDER BY "zpAmount" DESC
  LIMIT 1; 
  `;

  return sequelize
    .query(sql, {
      replacements: {
        interval,
      },
      type: sequelize.QueryTypes.SELECT,
    })
    .then(results => (results.length ? results[0] : null));
};

module.exports = votesDAL;
