var mongoose = require('mongoose');

var schema = mongoose.Schema({
    text: String
});

var Message = mongoose.model('Message', schema);

module.exports = Message;
