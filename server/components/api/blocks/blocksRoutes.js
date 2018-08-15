const router = require('express').Router();
const controller = require('./blocksController');
const transactionsController = require('../transactions/transactionsController');
const wrapAsync = require('../../../lib/wrapAsyncForExpressErrors');

router.route('/')
  .get(wrapAsync(controller.index));

router.route('/id/:id')
  .get(wrapAsync(controller.getById));

router.route('/:hashOrBlockNumber')
  .get(wrapAsync(controller.show));

router.route('/:blockNumber/assets')
  .get(wrapAsync(transactionsController.assets));

module.exports = router;