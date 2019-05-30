'use strict';

const path = require('path');
const queue = require('./lib/queue');
const TaskTimeLimiter = require('./lib/TaskTimeLimiter');
const Config = require('../server/config/Config');
const logger = require('./lib/logger')('cgp');
const slackLogger = require('../server/lib/slackLogger');
const getChain = require('../server/lib/getChain');

const cgpQueue = queue(Config.get('queues:cgp:name'));
const taskTimeLimiter = new TaskTimeLimiter(Config.get('queues:slackTimeLimit') * 1000);

// process ---
cgpQueue.process(path.join(__dirname, 'jobs/cgp/cgp.handler.js'));

// events
cgpQueue.on('active', function() {
  logger.info('A job has started.');
});

cgpQueue.on('completed', function(job, result) {
  logger.info(`A job has been completed. result=${result}`);
});

cgpQueue.on('failed', function(job, error) {
  logger.error(`A job has failed. error=${error.message}`);
  taskTimeLimiter.executeTask(() => {
    getChain().then(chain => {
      slackLogger.error(`A CGP job has failed, error=${error.message} chain=${chain}`);
    });
  });
});

// first clean the queue
Promise.all([
  cgpQueue.clean(0, 'active'),
  cgpQueue.clean(0, 'delayed'),
  cgpQueue.clean(0, 'wait'),
  cgpQueue.clean(0, 'completed'),
  cgpQueue.clean(0, 'failed'),
]).then(() => {
  // once only, for future commands, the blocks queue will add jobs
  cgpQueue.add({});
});

setInterval(() => {
  cgpQueue.clean(Config.get('queues:cleanAfter') * 1000, 'completed');
  cgpQueue.clean(Config.get('queues:cleanAfter') * 1000, 'failed');
}, Config.get('queues:cleanInterval') * 1000);
