const express = require('express'),
    router = express.Router(),
    mustBe = require('./auth').mustBe,
    parser = require('./parser'),
    config = require('../config');

const MongoClient = require('mongodb').MongoClient,
  dbUrl = `mongodb://${config.mongo.uri}/${config.mongo.db}`;

function connect() {
  return MongoClient.connect(dbUrl);
}

function upsertLocation(db, locationData) {
  return db.collection('locations').findOneAndUpdate(
    { remoteId:locationData.remoteId }, 
    { $set:locationData },
    { upsert:true, returnOriginal:false })

      .then(res => Promise.resolve(res.value));
}

function upsertEvent(db, location, eventData) {
  return db.collection('events').findOneAndUpdate(
    { remoteId:eventData.remoteId },
    { $set:eventData },
    { upsert:true, returnOriginal:false })

      .then(res => Promise.resolve(res.value))

      .then(event => Promise.resolve(Object.assign({}, event, {
        place: location
      })));
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
    start_time: new Date(e.start_time),
  });
  delete evt.id;
  delete evt.place;

  if (location) {
    evt.location_id = location._id;
  }

  return evt;
}

function addEvent(db, e) {
  if (e.place) {
    return upsertLocation(db, toLocationData(e))
      .then(location => upsertEvent(db, location, toEventData(location, e)));
  }
  else {
    return upsertEvent(db, undefined, toEventData(undefined, e));
  }
}

router.get('/events/:id', /* mustBe('admin'), */ function(req, res) {
  const id = req.params.id;

  Promise.all([ connect(), parser.parse(id) ])
    .then(values => addEvent(values[0], values[1]))
    .then(event => res.json(event))
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
    .then(events => Promise.resolve(events.sort((a, b) => new Date(a._id) - new Date(b._id))))
    .then(events => res.json(events))
    .catch(e => console.log(e));
});

router.get('/places', function(req, res) {
  connect()
    .then(db => db.collection('locations').find({}))
    .then(events => events.toArray())
    .then(events => res.json(events));
});

router.get('/import/:id', function(req, res) {
  const id = req.params.id;

  parser.feed(id)
    // map ids to parse requests
    .then(eventIds => Promise.resolve(eventIds.map(eventId => parser.parse(eventId))))
    // combine into one
    .then(parseReqs => Promise.all(parseReqs))
    // resolve and add to db
    .then(parseReq => Promise.all([connect(), parseReq]))
    // map to save requests
    .then(values =>  Promise.all(values[1].map(event => addEvent(values[0], event))))
    // done!!
    .then(added => res.json({added:added.length}));
});

module.exports = router;
