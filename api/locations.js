function upsertLocation(db, locationData) {
  // TODO better name string comparison
  return db.collection('locations').findOneAndUpdate(
    { remoteId:locationData.remoteId, name:locationData.name }, 
    { $set:locationData },
    { upsert:true, returnOriginal:false })

      .then(res => Promise.resolve(res.value));
}

function toLocationData(e) {
  const loc = Object.assign({}, e.place, {
    remoteId: e.place.id
  });
  delete loc.id;
  return loc;
}

module.exports = {
  toLocationData,
  upsertLocation,
};
