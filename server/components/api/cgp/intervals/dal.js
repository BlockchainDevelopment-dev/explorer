'use strict';

const dal = require('../../../../lib/dal');
const db = require('../../../../db/sequelize/models');
const constants = require('../lib/constants');

const cgpIntervalsDAL = dal.createDAL('CgpInterval');
const Sequelize = db.Sequelize;
const Op = Sequelize.Op;

// attributes to add the begin and end heights to the intervals
const BEGIN_HEIGHT_ATTRIBUTE = [
  Sequelize.literal(`"interval" * ${constants.INTERVAL_LENGTH} + 1`),
  'beginHeight',
];
const END_HEIGHT_ATTRIBUTE = [
  Sequelize.literal(`"interval" * ${constants.INTERVAL_LENGTH} + ${constants.INTERVAL_LENGTH}`),
  'endHeight',
];

cgpIntervalsDAL.findLatestFinished = async function() {
  return this.findOne({
    attributes: {
      include: [
        BEGIN_HEIGHT_ATTRIBUTE,
        END_HEIGHT_ATTRIBUTE,
      ],
    },
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
    attributes: {
      include: [
        BEGIN_HEIGHT_ATTRIBUTE,
        END_HEIGHT_ATTRIBUTE,
      ],
    },
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
    attributes: {
      include: [
        BEGIN_HEIGHT_ATTRIBUTE,
        END_HEIGHT_ATTRIBUTE,
      ],
    },
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
