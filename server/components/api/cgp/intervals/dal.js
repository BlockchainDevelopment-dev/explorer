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

// cgpIntervalsDAL.findCurrent = async function(currentBlock) {
//   return this.findOne({
//     where: {
//       [Op.and]: {
//         beginHeight: {
//           [Op.lte]: currentBlock,
//         },
//         endHeight: {
//           [Op.gt]: currentBlock,
//         },
//       },
//     },
//     order: [['beginHeight', 'ASC']],
//   });
// };

// cgpIntervalsDAL.findPrev = async function(currentBlock) {
//   return this.findOne({
//     where: {
//       endHeight: {
//         [Op.lte]: currentBlock,
//       },
//     },
//     order: [['endHeight', 'DESC']],
//   });
// };

// /**
//  * Find a few recent intervals
//  *
//  * @param {number} currentBlock
//  */
// cgpIntervalsDAL.findAllRecent = async function(currentBlock, limit = 5) {
//   const [prevs, current, next] = await Promise.all([
//     this.findAll({
//       where: {
//         endHeight: {
//           [Op.lte]: currentBlock,
//         },
//       },
//       order: [['endHeight', 'DESC']],
//       limit,
//     }),
//     this.findCurrent(currentBlock),
//     this.findNext(currentBlock),
//   ]);

//   const intervals = [];
//   next && intervals.push(next);
//   current && intervals.push(current);
//   intervals.push.apply(intervals, prevs);
//   return intervals;
// };

/**
 * Sets hasSnapshot to true
 * @param {number} id
 */
cgpIntervalsDAL.setStatus = async function(id, status) {
  return this.update(id, { status });
};

module.exports = cgpIntervalsDAL;
