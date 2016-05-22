// http://51elliot.blogspot.com/2013/08/testing-expressjs-rest-api-with-mocha.html
// http://www.chovy.com/node-js/testing-a-node-js-express-app-with-mocha-and-should-js/
if (process.env.NODE_ENV !== 'test') {
  console.log("Not in test mode!");
  process.exit(1);
}

var http = require('http'),
  should = require('should'),
  app  = require(__dirname + '/../app.js'),
  port = 3333,
  server,
  Event = require('../models/event'),
  mongoose = require('mongoose');

describe('api', function () {
  before (function (done) {
    server = app.listen(port, function (err, result) {
      if (err) {
        done(err);
      } else {
        done();
      }
    });
  });

  after(function (done) {
    server.close();
    done();
  });

  after(function (done) {
    // clears database
    mongoose.connection.db.dropDatabase(function(){
      mongoose.connection.close(function(){
        done();
      });
    });
  });

  describe('events service', function() {
    var expected;

    before(function(done) {
      expected = new Event({
        name: 'Test Event',
        description: 'Using this event for testing.',
        place: 'The basement.',
        time: Date.now()
      });

      expected.save(function(err, expected) {
        done();
      });
    });

    it('should get a list of events', function (done) {
      var params = {
        "host": "localhost",
        "port": port,
        "path": "/events",
        "method": "GET"
      };

      http.get(params, function (res) {
        res.statusCode.should.eql(200);

        res.on('data', function (d) {
          var events = JSON.parse(d.toString('utf8'));
          events.should.have.length(1);

          var actual = events[0];

          actual.should.have.property('name').and.eql(expected.name);
          done();
        });
      });
    });
  });
});
