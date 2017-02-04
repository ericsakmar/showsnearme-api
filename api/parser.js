const request = require('request-promise');
const config = require('../config');

function parse(id) {
  const options = {
    uri: `${config.parserUrl}/${id}`,
    json: true,
    headers: {
      'Content-Type':'application/json',
      'Authorization':config.authToken,
    }
  };

  return request(options);
}

function feed(id) {
  const options = {
    uri: `${config.parserUrl}/feed/${id}`,
    json: true,
    headers: {
      'Content-Type':'application/json',
      'Authorization':config.authToken,
    }
  };
  return request(options);
}

function feedInfo(id) {
  const options = {
    uri: `${config.parserUrl}/feed_info/${id}`,
    json: true,
    headers: {
      'Content-Type':'application/json',
      'Authorization':config.authToken,
    }
  };
  return request(options);
}

module.exports = {
  parse, feed, feedInfo
};
