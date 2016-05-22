// http://www.chovy.com/node-js/managing-config-variables-inside-a-node-js-application/
var env = process.env.NODE_ENV || 'development'
  , cfg = require('./config.'+env);

module.exports = cfg;
