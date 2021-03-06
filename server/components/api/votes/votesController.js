'use strict';

const httpStatus = require('http-status');
const jsonResponse = require('../../../lib/jsonResponse');
const HttpError = require('../../../lib/HttpError');
const votesBLL = require('./votesBLL');

module.exports = {
  index: async function(req, res) {
    const { interval, page, pageSize } = req.query;
    const formattedInterval = formatInterval(interval);

    const vote = await votesBLL.findAllVotesByInterval({
      interval: formattedInterval,
      page,
      pageSize,
    });
    if (vote) {
      res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, vote));
    } else {
      throw new HttpError(httpStatus.NOT_FOUND);
    }
  },
  relevantInterval: async function(req, res) {
    const { interval } = req.query;
    const formattedInterval = formatInterval(interval);

    const result = await votesBLL.findIntervalAndTally({ interval: formattedInterval });
    if (result) {
      res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, result));
    } else {
      throw new HttpError(httpStatus.NOT_FOUND);
    }
  },
  nextInterval: async function(req, res) {
    const result = await votesBLL.findNextInterval();
    if (result) {
      res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, result));
    } else {
      throw new HttpError(httpStatus.NOT_FOUND);
    }
  },
  results: async function(req, res) {
    const { interval, page, pageSize } = req.query;
    const formattedInterval = formatInterval(interval);

    const result = await votesBLL.findAllVoteResults({
      interval: formattedInterval,
      page,
      pageSize,
    });
    if (result) {
      res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, result));
    } else {
      throw new HttpError(httpStatus.NOT_FOUND);
    }
  },
  recentIntervals: async function(req, res) {
    const result = await votesBLL.findRecentIntervals();
    res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, result));
  },
};

function formatInterval(interval) {
  return isNaN(Number(interval)) || Number(interval) === 0 ? null : Number(interval);
}
