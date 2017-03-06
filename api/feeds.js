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

module.exports = { 
  addFeed,
  update,
};
