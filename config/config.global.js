var config = module.exports = {};

config.parserUrl = 'http://localhost:3000';
config.authToken = process.env.PARSER_TOKEN || 'parser_token';

// mongo config
config.mongo = {};
