var express = require('express'),
    router = express.Router(),
    Event = require('../models/event');

router.get('/events', function(req, res) {
  Event.find(function (err, events) {
    res.json(events);
  });
});

router.post('/events', function(req, res) {
  const event = new Event(req.body);

  event.save((err) => {
    res.status(201).json(event);
  });
});

module.exports = router;
