const locations = require('./locations');

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

function addEvent(db, e) {
  if (e.place) {
    return locations.upsertLocation(db, locations.toLocationData(e))
      .then(location => upsertEvent(db, location, toEventData(location, e)));
  }
  else {
    return upsertEvent(db, undefined, toEventData(undefined, e));
  }
}

module.exports = {
  addEvent,
  toEventData,
  upsertEvent,
};
