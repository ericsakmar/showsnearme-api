var express = require('express'),
    router = express.Router(),
    Event = require('../models/event');

router.get('/events', function(req, res) {
  Event.aggregate([{ 
    $group: {
      _id: { $dateToString: { format: '%Y-%m-%d', date: '$time' } },
      events: {$addToSet: "$$CURRENT"}
    }
  }])
  .exec()
  .then(
    (events) => { res.json(events); },
    (err) => { res.status(500).json(err) }
  );
});

router.post('/events', function(req, res) {
  const event = new Event(req.body);

  event.save().then(
    (event) => { res.status(201).json(event); },
    (err) => {
      var messages = Object.keys(err.errors).map((e) => err.errors[e].message);
      res.status(400).json(messages);
    }
  );
});

module.exports = router;
