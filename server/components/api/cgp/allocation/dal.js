'use strict';

const dal = require('../../../../lib/dal');

const allocationVotesDal = dal.createDAL('AllocationVote');

allocationVotesDal.bulkDeleteByIntervalId = async function(id, transaction) {
  return this.bulkDelete({
    where: {
      CgpIntervalId: id,
    },
    ...(transaction && { transaction }),
  });
};

allocationVotesDal.findAllByInterval = async function({ interval, limit, offset = 0 } = {}) {
  return this.findAll({
    include: [
      {
        model: this.db.CgpInterval,
        required: true,
        where: {
          interval,
        },
      },
    ],
    limit,
    offset,
  });
};

allocationVotesDal.countByInterval = async function({ interval } = {}) {
  return this.count({
    col: '*',
    include: [
      {
        model: this.db.CgpInterval,
        required: true,
        where: {
          interval,
        },
      },
    ],
  });
};

module.exports = allocationVotesDal;
