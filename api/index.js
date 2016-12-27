const express = require('express'),
    router = express.Router(),
    mustBe = require('./auth').mustBe,
    parser = require('./parser');

// TODO move these to config
const MongoClient = require('mongodb').MongoClient,
  dbUrl = 'mongodb://localhost:27017/api-dev';

function connect() {
  return MongoClient.connect(dbUrl);
}

function upsertLocation(db, locationData) {
  return db.collection('locations').findOneAndUpdate(
    { remoteId:locationData.remoteId }, 
    { $set:locationData },
    { upsert:true, returnNewDocument:true });
}

function getLocationId(location) {
  if (location.lastErrorObject.updatedExisting) {
    return location.value._id;
  }
  else {
    return location.lastErrorObject.upserted;
  }
}

function upsertEvent(db, eventData) {
  return db.collection('events').findOneAndUpdate(
    { remoteId:eventData.remoteId },
    { $set:eventData },
    { upsert:true, returnNewDocument:true });
}

function toLocationData(e) {
  return {
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
}

function toEventData(location, e) {
  const location_id = getLocationId(location);
  return {
    name: e.name,
    remoteId: e.id,
    description: e.description,
    location_id,
    time: e.start_time
    // more fields
  };            
}

function addEvent(db, e) {
  return upsertLocation(db, toLocationData(e))
    .then(location => upsertEvent(db, toEventData(location, e)))
}

router.get('/events/:id', /* mustBe('admin'), */ function(req, res) {
  const id = req.params.id;

  Promise.all([ connect(), parser.parse(id) ])
    .then(values => addEvent(values[0], values[1]))
    .then(event => res.json(event.value))
    .catch(e => console.log(e));
});

router.get('/events', function(req, res) {
  connect()
    .then(db => db.collection('events').find({}))
    .then(events => events.toArray())
    .then(events => res.json(events));
});

router.get('/places', function(req, res) {
  connect()
    .then(db => db.collection('locations').find({}))
    .then(events => events.toArray())
    .then(events => res.json(events));
});

// router.get('/events', /* mustBe('admin'), */ function(req, res) {
//   Event.aggregate([{ 
//     $group: {
//       _id: { $dateToString: { format: '%Y-%m-%d', date: '$time' } },
//       events: {$addToSet: "$$CURRENT"}
//     }
//   }])
//   .exec()
//   .then(
//     (events) => { res.json(events); },
//     (err) => { res.status(500).json(err) }
//   );
// });

module.exports = router;
