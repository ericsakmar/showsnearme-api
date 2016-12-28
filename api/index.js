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
    { upsert:true, returnOriginal:false });
}

function upsertEvent(db, eventData) {
  return db.collection('events').findOneAndUpdate(
    { remoteId:eventData.remoteId },
    { $set:eventData },
    { upsert:true, returnOriginal:false });
}

function toLocationData(e) {
  const loc = Object.assign({}, e.place, {
    remoteId: e.place.id
  });
  delete loc.id;
  return loc;
}

function toEventData(location, e) {
  const evt = Object.assign({}, e, {
    remoteId: e.id,
    location_id: location.value._id,
    start_time: new Date(e.start_time)
  });
  delete evt.id;
  delete evt.place;

  return evt;
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
    .then(db => db.collection('events').aggregate([
      {
        $lookup: {
          from: 'locations',
          localField: 'location_id',
          foreignField: '_id',
          as: 'place'
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$start_time' } },
          events: {$addToSet: "$$CURRENT"}
        }
      }
    ]))
    .then(cur => cur.toArray())
    .then(events => res.json(events));
});

router.get('/places', function(req, res) {
  connect()
    .then(db => db.collection('locations').find({}))
    .then(events => events.toArray())
    .then(events => res.json(events));
});

module.exports = router;
