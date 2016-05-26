var mongoose = require('mongoose');

var schema = mongoose.Schema({
  name: { type:String, required:true },
  description: String,
  place: { type:String, required:true },
  time: { type:Date, required:true }
});

var Event = mongoose.model('Event', schema);

module.exports = Event;

