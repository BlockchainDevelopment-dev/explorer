'use strict';

const httpStatus = require('http-status');
const jsonResponse = require('../../../../lib/jsonResponse');
const HttpError = require('../../../../lib/HttpError');
const intervalsBLL = require('./bll');
const formatInterval = require('../lib/formatInterval');

module.exports = {
  recentIntervals: async function(req, res) {
    const result = await intervalsBLL.findRecentIntervals(req.query);
    res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, result));
  },
  /**
   * Get an interval by interval number or the most recent one
   * send a non number as the interval parameter to get the recent one
   */
  relevantInterval: async function(req, res) {
    const { interval } = req.params;
    const formattedInterval = formatInterval(interval);

    const result = await intervalsBLL.findInterval({ interval: formattedInterval });
    if (result) {
      res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, result));
    } else {
      throw new HttpError(httpStatus.NOT_FOUND);
    }
  },
};
