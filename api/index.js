const express = require('express'),
    router = express.Router(),
    mustBe = require('./auth').mustBe,
    parser = require('./parser'),
    config = require('../config');

const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;

function connect() {
  return MongoClient.connect(config.mongo.uri);
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

function addFeed(db, feed) {
  feed.remoteId = feed.id;
  delete feed.id;
  return db.collection('feeds').findOneAndUpdate(
    { remoteId:feed.remoteId }, 
    { $set:feed },
    { upsert:true, returnOriginal:false })

      .then(res => Promise.resolve(res.value));
}


router.get('/events/:id', mustBe('admin', 'web'), function(req, res) {
  const id = req.params.id;

  Promise.all([ connect(), parser.parse(id) ])
    .then(values => addEvent(values[0], values[1]))
    .then(event => res.json(event))
    .catch(e => console.log(e));
});

router.get('/events', mustBe('admin', 'web'),  function(req, res) {
  const filters = {};

  if (req.query.since) {
    filters['start_time'] = {
      '$gte':  new Date(req.query.since)
    };
  }

  if (req.query.until) {
    filters['start_time'] = filters['start_time'] || {};
    filters['start_time']['$lte'] =  new Date(req.query.until);
  }

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
        $match: filters 
      }
    ]))
    .then(query => query.sort({start_time:1}))
    .then(cur => cur.toArray())
    .then(events => res.json(events))
    .catch(e => console.log(e));
});

router.get('/places', mustBe('admin', 'web'), function(req, res) {
  connect()
    .then(db => db.collection('locations').find({}))
    .then(events => events.toArray())
    .then(events => res.json(events));
});

router.get('/import/:id', mustBe('admin'), function(req, res) {
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

router.get('/feeds', mustBe('admin'), function(req, res) {
  connect()
    .then(db => db.collection('feeds').find({}))
    .then(feeds => feeds.sort({ name: 1}))
    .then(feeds => feeds.toArray())
    .then(feeds => res.json(feeds))
    .catch(e => console.log(e));
});

router.post('/feeds/:id', mustBe('admin'), function(req, res) {
  const id = req.params.id;
  Promise.all([ connect(), parser.feedInfo(id) ])
    .then(values => addFeed(values[0], values[1]))
    .then(feed => res.json(feed));
});

router.delete('/feeds/:id', mustBe('admin'), function(req, res) {
  const id = ObjectId(req.params.id);
  connect()
    .then(db => db.collection('feeds'))
    .then(feeds => feeds.findOneAndDelete({ '_id': id }))
    .then(r => res.json({ msg: "deleted" }))
    .catch(e => console.log(e));
});

module.exports = router;
