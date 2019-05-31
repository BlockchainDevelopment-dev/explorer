'use strict';

const dal = require('../../../../lib/dal');
const db = require('../../../../db/sequelize/models');

const cgpIntervalsDAL = dal.createDAL('CgpInterval');
const Op = db.Sequelize.Op;

cgpIntervalsDAL.findLatestFinished = async function() {
  return this.findOne({
    where: {
      status: 'finished',
    },
    order: [['interval', 'DESC']],
  });
};

cgpIntervalsDAL.bulkDeleteIntervals = async function(intervals = [], transaction) {
  return this.bulkDelete({
    where: {
      interval: {
        [Op.in]: intervals,
      },
    },
    ...(transaction && { transaction }),
  });
};

cgpIntervalsDAL.findByInterval = async function(interval) {
  return this.findOne({
    where: {
      interval,
    },
  });
};

/**
 * Find a few recent intervals by the current state of the database
 *
 * @param {number} lastInterval the last interval to get
 * @param {number} [limit=5]
 */
cgpIntervalsDAL.findAllRecent = async function(lastInterval, limit = 5) {
  return this.findAll({
    where: {
      interval: {
        [Op.lte]: lastInterval,
      },
    },
    order: [['interval', 'DESC']],
    limit,
  });
};

module.exports = cgpIntervalsDAL;
