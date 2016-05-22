var config = module.exports = {};

// mongo config
config.mongo = {};
config.mongo.uri = process.env.MONGO_URI || 'localhost';
// config.mongo.db
