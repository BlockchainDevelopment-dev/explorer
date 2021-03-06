const router = require('express').Router();
const controller = require('./contractsController');
const wrapAsync = require('../../../lib/wrapAsyncForExpressErrors');

router.route('/')
  .get(wrapAsync(controller.index));

router.route('/:address')
  .get(wrapAsync(controller.show));

router.route('/:address/assets')
  .get(wrapAsync(controller.assets));

router.route('/:address/commands')
  .get(wrapAsync(controller.commands));

module.exports = router;