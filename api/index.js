const express = require('express'),
    router = express.Router(),
    mustBe = require('./auth').mustBe,
    parser = require('./parser'),
    config = require('../config'),
    events = require('./events'),
    locations = require('./locations'),
    feeds = require('./feeds');

const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;

function connect() {
  return MongoClient.connect(config.mongo.uri);
}

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

  filters['location'] = { 
    $nearSphere: { 
      $geometry: { type: "Point", coordinates: [ -79.9901, 40.4417] }, 
      $maxDistance: 80000 // about 50 mi
    } 
  };

  connect()
    .then(db => db.collection('events').find(filters, { description: 0 }))
    .then(query => query.sort({start_time:1}))
    .then(cur => cur.toArray())
    .then(events => res.json(events))
    .catch(e => console.log(e));
});

router.get('/import/:id', mustBe('admin'), function(req, res) {
  const id = req.params.id;

  connect()
    .then(db => feeds.importFeed(db, id))
    .then(feed => res.json(feed))
    .catch(e => console.log(e));

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
    .then(values => feeds.addFeed(values[0], values[1]))
    .then(feed => res.json(feed))
    .catch(e => console.log(e));
});

router.delete('/feeds/:id', mustBe('admin'), function(req, res) {
  const id = ObjectId(req.params.id);
  connect()
    .then(db => db.collection('feeds'))
    .then(feeds => feeds.findOneAndDelete({ '_id': id }))
    .then(r => res.json({ msg: "deleted" }))
    .catch(e => console.log(e));
});

router.post('/mega_import', mustBe('admin'), function(req, res) {

  connect()
    .then(db => feeds.megaImport(db)) 
    .then(f => res.json({ count: f }))
    .catch(e => console.log(e));
    
});

module.exports = router;
