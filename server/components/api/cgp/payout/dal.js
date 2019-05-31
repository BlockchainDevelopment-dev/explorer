'use strict';

const dal = require('../../../../lib/dal');

const payoutVotesDal = dal.createDAL('PayoutVote');

payoutVotesDal.bulkDeleteByIntervalId = async function(id, transaction) {
  return this.bulkDelete({
    where: {
      CgpIntervalId: id,
    },
    ...(transaction && { transaction }),
  });
};

payoutVotesDal.findAllByInterval = async function({ interval, limit, offset = 0 } = {}) {
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

payoutVotesDal.countByInterval = async function({ interval } = {}) {
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

module.exports = payoutVotesDal;
