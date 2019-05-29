'use strict';

const dal = require('../../../../lib/dal');

const allocationVotesDal = dal.createDAL('AllocationVote');

allocationVotesDal.bulkDeleteByIntervalId = async function(id, transaction) {
  return this.bulkDelete({
    where: {
      CgpIntervalId: id
    },
    ...(transaction && { transaction }),
  });
};

module.exports = allocationVotesDal;
