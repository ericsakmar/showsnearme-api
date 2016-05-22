var express = require('express'),
    router = express.Router(),
    Event = require('../models/event');

router.get('/events', function(req, res, next) {
  Event.find(function (err, events) {
    res.json(events);
  });
});

module.exports = router;
