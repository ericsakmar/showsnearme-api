var express = require('express'),
    router = express.Router(),
    Message = require('../models/message');

router.get('/messages', function(req, res, next) {
  Message.find(function (err, messages) {
    res.json(messages);
  });
});

module.exports = router;
