'use strict';

const httpStatus = require('http-status');
const jsonResponse = require('../../../../lib/jsonResponse');
const HttpError = require('../../../../lib/HttpError');
const votesBLL = require('./bll');
const formatInterval = require('../lib/formatInterval');

module.exports = {
  index: async function(req, res) {
    const { interval } = req.params;
    const { page, pageSize } = req.query;
    const formattedInterval = formatInterval(interval);

    const votes = await votesBLL.findAllVotesByInterval({
      interval: formattedInterval,
      page,
      pageSize,
    });
    if (votes) {
      res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, votes));
    } else {
      throw new HttpError(httpStatus.NOT_FOUND);
    }
  },
};
