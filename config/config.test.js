var config = require('./config.global');

config.env = 'test';

config.mongo.uri = 'mongodb://localhost:27017/api-test';

module.exports = config;
