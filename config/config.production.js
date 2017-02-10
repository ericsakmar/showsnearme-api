var config = require('./config.global');

config.parserUrl = 'https://showsnearme-parser.herokuapp.com';

config.env = 'production';

config.mongo.uri = process.env.MONGODB_URI;

module.exports = config;
