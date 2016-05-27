const express = require('express'),
    router = express.Router(),
    Event = require('../models/event'),
    mustBe = require('./auth').mustBe;

router.get('/events/:id', mustBe('admin'), function(req, res) {
  Event.findById(req.params.id).then(
    (event) => res.json(event),
    (err) => res.status(404).json(err)
  );
});

router.get('/events', mustBe('admin'), function(req, res) {
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

router.post('/events', mustBe('admin'), function(req, res) {
  const event = new Event(req.body);

  event.save().then(
    (event) => { res.status(201).json(event); },
    (err) => {
      if (err.name === 'ValidationError') {
        const messages = Object.keys(err.errors).map((e) => err.errors[e].message);
        res.status(400).json(messages);
      }
      else {
        res.status(500).json(err);
      }
    }
  );
});

router.put('/events/:id', mustBe('admin'), (req, res) => {
  delete req.body._id;

  Event.findOneAndUpdate({ _id:req.params.id }, req.body, { new:true }).then(
    (event) => res.json(event),
    (err) => res.status(500).json(err)
  );
});

module.exports = router;
