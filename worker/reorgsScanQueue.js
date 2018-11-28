'use strict';

const path = require('path');
const Queue = require('bull');
const TaskTimeLimiter = require('./lib/TaskTimeLimiter');
const Config = require('../server/config/Config');
const logger = require('./lib/logger')('reorg-scan');
const slackLogger = require('../server/lib/slackLogger');

const reorgScanQueue = new Queue(
  Config.get('queues:reorgs-scan:name'),
  Config.any(['REDISCLOUD_URL', 'redis'])
);

const taskTimeLimiter = new TaskTimeLimiter(Config.get('queues:slackTimeLimit') * 1000);

// process ---
reorgScanQueue.process(path.join(__dirname, 'jobs/blocks/reorgs.handler.js'));

// events
reorgScanQueue.on('active', function(job, jobPromise) {
  logger.info(`A job has started. ID=${job.id}`);
});

reorgScanQueue.on('completed', function(job, result) {
  if(result.forks.length > 0) {
    const message = `A reorg scan was completed and found forks! ${JSON.stringify(result)}`;
    slackLogger.error(message);
    logger.warn(message);
  }
  else {
    logger.info(`A reorg scan was completed and did not found forks. ${JSON.stringify(result)}`);
  }
});

reorgScanQueue.on('failed', function(job, error) {
  logger.error(`A job has failed. ID=${job.id}, error=${error}`);
  taskTimeLimiter.executeTask(() => {
    slackLogger.error(`A reorgsQueue job has failed, error=${error}`);
  });
});

// first clean the queue
Promise.all([
  reorgScanQueue.clean(0, 'active'),
  reorgScanQueue.clean(0, 'delayed'),
  reorgScanQueue.clean(0, 'wait'),
  reorgScanQueue.clean(0, 'completed'),
  reorgScanQueue.clean(0, 'failed'),
]).then(() => {
  // schedule - search all of the blocks for forks
  reorgScanQueue.add(
    { all: true, delete: false },
    { repeat: { cron: '0 0 * * 0' } } // At 00:00 on Sunday.
  );
});

setInterval(() => {
  reorgScanQueue.clean(Config.get('queues:cleanAfter') * 1000, 'completed');
  reorgScanQueue.clean(Config.get('queues:cleanAfter') * 1000, 'failed');
}, Config.get('queues:cleanInterval') * 1000);