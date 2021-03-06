'use strict';

const path = require('path');
const queue = require('./lib/queue');
const TaskTimeLimiter = require('./lib/TaskTimeLimiter');
const Config = require('../server/config/Config');
const logger = require('./lib/logger')('repovotes');
const slackLogger = require('../server/lib/slackLogger');
const getChain = require('../server/lib/getChain');

const votesQueue = queue(Config.get('queues:repovotes:name'));

const taskTimeLimiter = new TaskTimeLimiter(Config.get('queues:slackTimeLimit') * 1000);

// process ---
votesQueue.process(path.join(__dirname, 'jobs/repovotes/votes.handler.js'));

// events
votesQueue.on('active', function(job, jobPromise) {
  logger.info(`A job has started. ID=${job.id}`);
});

votesQueue.on('completed', function(job, result) {
  logger.info(`A job has been completed. ID=${job.id} result=${result}`);
});

votesQueue.on('failed', function(job, error) {
  logger.error(`A job has failed. ID=${job.id}, error=${error.message}`);
  taskTimeLimiter.executeTask(() => {
    getChain().then(chain => {
      slackLogger.error(`A Votes job has failed, error=${error.message} chain=${chain}`);
    });
  });
});

// first clean the queue
Promise.all([
  votesQueue.clean(0, 'active'),
  votesQueue.clean(0, 'delayed'),
  votesQueue.clean(0, 'wait'),
  votesQueue.clean(0, 'completed'),
  votesQueue.clean(0, 'failed'),
]).then(() => {
  // once only, for future commands, the commands queue will add jobs
  votesQueue.add({});
});

setInterval(() => {
  votesQueue.clean(Config.get('queues:cleanAfter') * 1000, 'completed');
  votesQueue.clean(Config.get('queues:cleanAfter') * 1000, 'failed');
}, Config.get('queues:cleanInterval') * 1000);
