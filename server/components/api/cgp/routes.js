const router = require('express').Router();
const intervalsController = require('./intervals/controller');
const allocationController = require('./allocation/controller');
const payoutController = require('./payout/controller');
const wrapAsync = require('../../../lib/wrapAsyncForExpressErrors');

// intervals
router.route('/intervals').get(wrapAsync(intervalsController.recentIntervals));
router.route('/intervals/:interval').get(wrapAsync(intervalsController.relevantInterval));

// allocation
router.route('/intervals/:interval/allocation').get(wrapAsync(allocationController.index));
// payout
router.route('/intervals/:interval/payout').get(wrapAsync(payoutController.index));

module.exports = router;