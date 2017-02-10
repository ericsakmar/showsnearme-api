var config = require('./config.global');

config.env = 'development';

config.mongo.uri = 'mongodb://localhost:27017/api-dev';

module.exports = config;
