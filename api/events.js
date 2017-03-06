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

module.exports = {
  toEventData,
  upsertEvent,
};
