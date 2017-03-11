const parser = require('./parser');
const events = require('./events');

function addFeed(db, feed) {
  feed.remoteId = feed.id;
  delete feed.id;
  return db.collection('feeds').findOneAndUpdate(
    { remoteId:feed.remoteId }, 
    { $set:feed },
    { upsert:true, returnOriginal:false })

      .then(res => Promise.resolve(res.value));
}

function update(db, remoteId, updates) {

  return db.collection('feeds').findOneAndUpdate(
    { remoteId },
    { $set: updates },
    { returnOriginal: false })

      .then(res => Promise.resolve(res.value));
}

function importFeed(db, id) {
  return parser.feed(id)
    // map ids to parse requests
    .then(eventIds => Promise.resolve(eventIds.map(eventId => parser.parse(eventId))))
    // combine into one
    .then(parseReqs => Promise.all(parseReqs))
    // map to save requests
    .then(values =>  Promise.all(values.map(event => events.addEvent(db, event))))
    // update feed data
    .then(added => update(db, id, { lastImport: { date: new Date(), count: added.length } }))
    // errors
    .catch(e => {
      console.log(e);
      return Promise.reject(e);
    });
}

function megaImport(db) {
  return Promise.resolve(db.collection('feeds').find({}))
    .then(f => f.toArray())
    // create import requests for each feed
    .then(feeds => feeds.map(feed => importFeed(db, feed.remoteId)))
    // execute
    .then(imports => Promise.all(imports))
    // add up the totals
    .then(imported => imported.map(feed => feed.lastImport.count))
    .then(counts => counts.reduce((count, total) => total + count, 0))
    // errors
    .catch(e => {
      console.log(e);
      return Promise.reject(e);
    });
}

module.exports = { 
  addFeed,
  update,
  importFeed,
  megaImport,
};
