const parser = require('./parser');
const events = require('./events');

function addFeed(db, feed) {
  feed.remoteId = feed.id;
  delete feed.id;
  return db
    .collection('feeds')
    .findOneAndUpdate(
      {remoteId: feed.remoteId},
      {$set: feed},
      {upsert: true, returnOriginal: false}
    )

    .then(res => Promise.resolve(res.value));
}

function update(db, remoteId, updates) {
  return db
    .collection('feeds')
    .findOneAndUpdate({remoteId}, {$set: updates}, {returnOriginal: false})

    .then(res => Promise.resolve(res.value));
}

function importFeed(db, id) {
  return (
    parser
      .feed(id)
      // map ids to parse requests
      .then(eventIds =>
        Promise.resolve(eventIds.map(eventId => parser.parse(eventId)))
      )
      // combine into one
      .then(parseReqs => Promise.all(parseReqs))
      // transform
      .then(rawEvents =>
        rawEvents.map(rawEvent => {
          const newEvent = Object.assign({}, rawEvent, {
          });

          if (rawEvent.place) {
            newEvent.place = {};

            if (rawEvent.place.name) {
              newEvent.place.name = rawEvent.place.name;
            }

            if (rawEvent.place.id) {
              newEvent.place.id = rawEvent.place.id;
            }

            if (rawEvent.place.location) {
              newEvent.location = {
                type: 'Point',
                coordinates: [
                  rawEvent.place.location.longitude,
                  rawEvent.place.location.latitude
                ],
              };
            }
          } else {
            // set it to pittsburgh
            newEvent.location = {
              type: 'Point',
              coordinates: [-79.9901, 40.4417]
            };
          }

          return newEvent;
        })
      )
      // map to save requests
      .then(values =>
        Promise.all(values.map(event => events.addEvent(db, event)))
      )
      // update feed data
      .then(added =>
        update(db, id, {lastImport: {date: new Date(), count: added.length}})
      )
      // errors
      .catch(e => {
        console.log(e);
        return Promise.reject(e);
      })
  );
}

function megaImport(db) {
  return (
    Promise.resolve(db.collection('feeds').find({}))
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
      })
  );
}

module.exports = {
  addFeed,
  update,
  importFeed,
  megaImport,
};
