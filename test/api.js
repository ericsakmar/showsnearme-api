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
  Location = require('../models/location'),
  mongoose = require('mongoose'),
  keys = require('../api/keys');

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
    var e1, e2, e3,
      l1, l2;

    const getParams = {
      "host": "localhost",
      "port": port,
      "path": "/events",
      "method": "GET",
      headers: {
        'Authorization': keys.admin
      }
    };

    const postParams = {
      host:'localhost', 
      port:port, 
      path:'/events', 
      method:'POST',
      headers: {
        'Content-Type':'application/json',
        'Authorization': keys.admin
      }
    };

    const putParams = Object.assign({}, postParams, { method:'PUT' });
    
    function call(params, event, done) {
      const req = http.request(params, (res) => {
        var resBody = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => resBody += chunk );
        res.on('end', () => done(res, JSON.parse(resBody)));
      });

      req.write(JSON.stringify(event));
      req.end();
    }

    function create(event, done) {
      call(postParams, event, done);
    }

    function read(id, done) {
      const params = Object.assign({}, getParams, {
        path:`${getParams.path}/${id}`
      });

      http.get(params, (res) => {
        var resBody = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => resBody += chunk );
        res.on('end', () => {
          done(res, JSON.parse(resBody))
        });
      });
    }

    function update(event, done) {
      const params = Object.assign({}, putParams, {
        path:`${putParams.path}/${event._id}`
      });

      call(params, event, done);
    }

    before(function(done) {
      l1 = new Location({
        name: 'Location 1',
        remoteId: 'l1'
      });

      l2 = new Location({
        name: 'Location 2',
        remoteId: 'l2'
      });

      e1 = new Event({
        name: 'Test Event',
        remoteId: 'e1',
        description: 'Using this event for testing.',
        time: new Date('2016-05-28')
      });
      
      e2 = new Event({
        name: 'Test Event 2',
        remoteId: 'e2',
        description: 'Using this event for testing.',
        time: new Date('2016-05-28')
      });

      e3 = new Event({
        name: 'Test Event 3',
        remoteId: 'e3',
        description: 'Using this event for testing.',
        time: new Date('2016-05-27')
      });

      Location.create([l1, l2], function(err) {
        e1.location = l1;
        e2.location = l1;
        e3.location = l2;

        Event.create([e1, e2, e3], function(err) {
          done();
        });
      });
    });

    it('lists events', function (done) {
      http.get(getParams, function (res) {
        res.statusCode.should.eql(200);

        res.on('data', function (d) {
          var actual = JSON.parse(d.toString('utf8'));
          actual.should.have.length(2);

          actual[0]._id.should.eql('2016-05-27');
          actual[0].events.length.should.eql(1);

          actual[1]._id.should.eql('2016-05-28');
          actual[1].events.length.should.eql(2);

          done();
        });
      });
    });

    it('requires permissions for list', (done) => {
      const params = Object.assign({}, getParams, {
        headers: Object.assign({}, getParams.headers, {
          'Authorization': 'nope'
        })
      });

      http.get(params, (res) => {
        res.statusCode.should.eql(401);
        done();
      });
    });

    it('adds an event', function(done) {
      const e4 = {
        name: 'Test Event 4',
        remoteId: 'e4',
        description: 'Using this event for testing.',
        time: new Date('2016-05-28'),
        location: {
          name: 'Location 3',
          remoteId: 'l3'
        }
      };

      create(e4, (res, actual) => {
        res.statusCode.should.eql(201);
        actual.should.have.property('_id');
        actual.name.should.eql(e4.name);
        done();
      });
    });

    it('validates an event', function(done) {
      const data = {
        name: 'Missing Required'
      };

      create(data, (res, actual) => {
        res.statusCode.should.eql(400);
        actual.should.containEql('Path `time` is required.');
        done();
      });
    });

    it('requires permissions for create', (done) => {
      const params = Object.assign({}, postParams, {
        headers: Object.assign({}, postParams.headers, {
          'Authorization': 'nope'
        })
      });
      
      const e = new Event({
        name: 'Unauthorized',
        remoteId: 'e',
        description: 'Using this event for testing.',
        time: new Date('2016-05-28')
      });

      call(params, e, (res, actual) => {
        res.statusCode.should.eql(401);
        done();
      });
    });

    it('shows an event', (done) => {
      read(e1._id, (res, actual) => {
        res.statusCode.should.eql(200);
        actual._id.should.eql(e1._id.toString());
        actual.name.should.eql(e1.name);
        done();
      });
    });

    it('404s when it should', (done) => {
      read('123', (res, actual) => {
        res.statusCode.should.eql(404);
        done();
      });
    });

    it('requires permissions for read', (done) => {
      const params = Object.assign({}, getParams, {
        path:`${getParams.path}/${e1._id}`,
        headers: Object.assign({}, getParams.headers, {
          'Authorization': 'nope'
        })
      });

      http.get(params, (res) => {
        res.statusCode.should.eql(401);
        done();
      });
    });

    it('updates an event', (done) => {
      e1.name = 'Updated Name';

      update(e1, (res, actual) => {
        res.statusCode.should.eql(200);
        actual.name.should.eql(e1.name);
        done();
      });
    });

    it('requires permissions to update', (done) => {
      e1.name = 'Updated Name';

      const params = Object.assign({}, putParams, {
        path:`${putParams.path}/${e1._id}`,
        headers: Object.assign({}, postParams.headers, {
          'Authorization': 'nope'
        })
      });

      call(params, e1, (res, actual) => {
        res.statusCode.should.eql(401);
        done();
      });
    });
  });
});
