var mongoose = require('mongoose');

var schema = mongoose.Schema({
  name: { type:String, required:true },
  remoteId: { type:String, required:true, unique:true, index:true },
  street: String,
  city: String,
  state: String,
  zip: String,
  country: String,
  latitude: Number,
  longitude: Number
});

var Location = mongoose.model('Location', schema);

module.exports = Location;
