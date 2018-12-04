'use strict';

const path = require('path');
const Queue = require('bull');
const TaskTimeLimiter = require('./lib/TaskTimeLimiter');
const Config = require('../server/config/Config');
const logger = require('./lib/logger')('infos');
const slackLogger = require('../server/lib/slackLogger');

const updateGeneralInfosQueue = new Queue(
  Config.get('queues:updateGeneralInfos:name'),
  Config.any(['REDISCLOUD_URL', 'redis'])
);

const taskTimeLimiter = new TaskTimeLimiter(Config.get('queues:slackTimeLimit') * 1000);

// process ---
updateGeneralInfosQueue.process(path.join(__dirname, 'jobs/infos/updateGeneralInfos.handler.js'));

// events
updateGeneralInfosQueue.on('active', function(job, jobPromise) {
  logger.info(`A job has started. ID=${job.id}`);
});

updateGeneralInfosQueue.on('completed', function(job, result) {
  logger.info(`A job has been completed. ID=${job.id} result=${result}`);
});

updateGeneralInfosQueue.on('failed', function(job, error) {
  logger.error(`A job has failed. ID=${job.id}, error=${error.message}`);
  taskTimeLimiter.executeTask(() => {
    slackLogger.error(`An UpdateGeneralInfos job has failed, error=${error.message}`);
  });
});

// first clean the queue
Promise.all([
  updateGeneralInfosQueue.clean(0, 'active'),
  updateGeneralInfosQueue.clean(0, 'delayed'),
  updateGeneralInfosQueue.clean(0, 'wait'),
  updateGeneralInfosQueue.clean(0, 'completed'),
  updateGeneralInfosQueue.clean(0, 'failed'),
]).then(() => {
  // schedule ---
  updateGeneralInfosQueue.add(
    {},
    { repeat: { cron: '0 1 * * *' } } // once a day at 1:00
  );
  // now
  updateGeneralInfosQueue.add({});
});

setInterval(() => {
  updateGeneralInfosQueue.clean(Config.get('queues:cleanAfter') * 1000, 'completed');
  updateGeneralInfosQueue.clean(Config.get('queues:cleanAfter') * 1000, 'failed');
}, Config.get('queues:cleanInterval') * 1000);
