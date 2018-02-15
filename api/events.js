const locations = require('./locations');

function toEventData(location, e) {
  return Object.assign({}, e, {
    start_time: new Date(e.start_time),
  });
}

function upsertEvent(db, eventData) {
  return db
    .collection('events')
    .findOneAndUpdate(
      {id: eventData.id},
      {$set: eventData},
      {upsert: true, returnOriginal: false}
    )
    .then(res => Promise.resolve(res.value));
}

function addEvent(db, e) {
  return upsertEvent(db, toEventData(undefined, e));
}

module.exports = {
  addEvent,
  toEventData,
  upsertEvent,
};
