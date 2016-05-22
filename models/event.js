var mongoose = require('mongoose');

var schema = mongoose.Schema({
    name: String,
    description: String,
    place: String, // probably make a separate type for this
    time: Date
});

var Event = mongoose.model('Event', schema);

module.exports = Event;

