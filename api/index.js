const express = require('express'),
    router = express.Router(),
    Event = require('../models/event'),
    Location = require('../models/location'),
    mustBe = require('./auth').mustBe,
    parser = require('./parser');

router.get('/events/:id', /* mustBe('admin'), */ function(req, res) {
  const id = req.params.id;
  
  parser.parse(id).then(e => console.log(e));

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
  const params = Object.assign({}, req.body),
    locationData = params.location;

  delete params.location;
  
  var promise;

  if (locationData) {
    promise = Location.findOneAndUpdate(
      {remoteId: locationData.remoteId},
      locationData,
      { upsert:true, new:true })

      .then(
        (location) => {
          const event = new Event(params);
          event.location = location._id;
          return event.save();
        }
      )
  }
  else {
    const event = new Event(params);
    promise = event.save();
  }

  promise
    .then(
      (event) => {
        return Event.populate(event, { path:'location' }); 
      },
      (err) => {
        if (err.name === 'ValidationError') {
          const messages = Object.keys(err.errors).map((e) => err.errors[e].message);
          res.status(400).json(messages);
        }
        else {
          res.status(500).json(err);
        }
      }
    )

    .then(
      (event) => { 
        res.status(201).json(event);
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
