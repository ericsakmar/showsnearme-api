var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var config = require('./config');
var api = require('./api');

var app = express();

var config = require('./config');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// uncomment to serve static assets
// app.use(express.static(path.join(__dirname, 'public')));

// cors, but only for dev
app.use(function(req, res, next) {
  if (config.env === 'development') {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  }
  next();
});

// https, but only for prod
var httpsOnly = function(req, res, next) {
  if (config.env === 'production') {
    if (req.headers['x-forwarded-proto'] === 'https') {
      return next();
    } else {
      // no https, no data
      var err = new Error('Not Found');
      err.status = 404;
      next(err);
    }
  } else {
    return next();
  }
};
app.use(httpsOnly);

app.use('/', api);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.json({
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.json({
    message: err.message,
    error: {}
  });
});


module.exports = app;
