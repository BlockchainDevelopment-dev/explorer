'use strict';

const dal = require('../../../../lib/dal');

const payoutVotesDal = dal.createDAL('PayoutVote');

payoutVotesDal.bulkDeleteByIntervalId = async function(id, transaction) {
  return this.bulkDelete({
    where: {
      CgpIntervalId: id
    },
    ...(transaction && { transaction }),
  });
};

module.exports = payoutVotesDal;
