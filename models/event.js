var mongoose = require('mongoose');

var schema = mongoose.Schema({
  name: { type:String, required:true },
  remoteId: { type:String, required:true, unique:true, index:true },
  description: String,
  location: { type:mongoose.Schema.Types.ObjectId, ref:'Location' },
  time: { type:Date, required:true }
});

var Event = mongoose.model('Event', schema);

module.exports = Event;

