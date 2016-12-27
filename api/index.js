const express = require('express'),
    router = express.Router(),
    Event = require('../models/event'),
    Location = require('../models/location'),
    mustBe = require('./auth').mustBe,
    parser = require('./parser');

router.get('/events/:id', /* mustBe('admin'), */ function(req, res) {
  const id = req.params.id;
  
  parser.parse(id).then(e => {

    const locationData = {
      name: e.place.name,
      remoteId: e.place.id,
      street: e.place.location.street,
      city: e.place.location.city,
      state: e.place.location.state,
      zip: e.place.location.zip,
      country: e.place.location.country,
      latitude: e.place.location.latitude,
      longitude: e.place.location.longitude
    };

    Location.findOneAndUpdate(
      {remoteId: locationData.remoteId},
      locationData,
      { upsert:true, new:true })

        .then(loc => {
          const eventData = {
            name: e.name,
            remoteId: e.id,
            description: e.description,
            location: loc,
            time: e.start_time
            // more fields
          };            

          return Event.findOneAndUpdate(
            {remoteId: eventData.remoteId},
            eventData,
            { upsert:true, new:true });
        })
      
        .then(
          (event) => res.json(event),
          (err) => res.status(404).json(err)
        );
  });
});

router.get('/events', /* mustBe('admin'), */ function(req, res) {
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

module.exports = router;
