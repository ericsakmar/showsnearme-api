// http://51elliot.blogspot.com/2013/08/testing-expressjs-rest-api-with-mocha.html
// http://www.chovy.com/node-js/testing-a-node-js-express-app-with-mocha-and-should-js/
if (process.env.NODE_ENV !== 'test') {
  console.log("Not in test mode!");
  process.exit(1);
}

var http = require('http'),
  expect = require('chai').expect,
  app  = require(__dirname + '/../app.js'),
  sinon = require('sinon'),
  port = 3001,
  server,
  keys = require('../api/keys'),
  config = require('../config'),
  parser = require('../api/parser'),
  ObjectId = require('mongodb').ObjectId;

const MongoClient = require('mongodb').MongoClient,
  dbUrl = `mongodb://${config.mongo.uri}/${config.mongo.db}`;

function connect() {
  return MongoClient.connect(dbUrl);
}

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
    connect()
      .then(db => db.dropDatabase())
      .then(res => done());
  });

  describe('events service', function() {

    const getParams = {
      "host": "localhost",
      "port": port,
      "path": "/events",
      "method": "GET"
    };

    describe('index', function() {
      var e1, e2, e3;

      before(function(done) {

        e1 = {
          name: 'e1',
          start_time: new Date('2016-08-25T23:00:00.000Z')
        };
        
        e2 = {
          name: 'e2',
          start_time: new Date('2016-08-26T23:00:00.000Z')
        };

        e3 = {
          name: 'e3',
          start_time: new Date('2016-08-26T23:00:00.000Z')
        };

        connect()
          .then(db => db.collection('events').insertMany([e1, e2, e3]))
          .then(res => done());
      });

      it('groups events by date', function (done) {

        http.get(getParams, function (res) {
          expect(res.statusCode).to.equal(200);

          res.on('data', function (d) {
            var actual = JSON.parse(d.toString('utf8'));
            expect(actual.length).to.equal(2);

            expect(actual[0]._id).to.equal('2016-08-25');
            expect(actual[0].events.length).to.equal(1);

            expect(actual[1]._id).to.equal('2016-08-26');
            expect(actual[1].events.length).to.equal(2);

            done();
          });
        });
      });

      xit('requires permissions for list', (done) => {
        const params = Object.assign({}, getParams, {
          headers: Object.assign({}, getParams.headers, {
            'Authorization': 'nope'
          })
        });

        http.get(params, (res) => {
          expect(res.statusCode).to.equal(401);
          done();
        });
      });

    });

    describe('detail', function() {
      
      it('calls the parser', (done) => {

        const expected = {
          id: 'e1',
          start_time: '2016-08-25T23:00:00.000Z',
          place: {
            id: 'p1',
            name: 'place'
          }
        };

        sinon.stub(parser, 'parse', () => Promise.resolve(expected));

        const id = 1;
        const params = Object.assign({}, getParams, {
          path: `${getParams.path}/${id}`
        });

        http.get(params, function (res) {
          expect(res.statusCode).to.equal(200);
          expect(parser.parse.called).to.be.true;

          res.on('data', function (d) {
            const actual = JSON.parse(d.toString('utf8'));

            // location mappings
            expect(actual.place._id).not.to.be.undefined;
            expect(actual.place.remoteId).to.equal(expected.place.id);

            // event mappings
            expect(actual._id).not.to.be.undefined;
            expect(actual.remoteId).to.equal(expected.id);
            expect(actual.start_time).to.equal(expected.start_time);
            expect(actual.location_id).to.equal(actual.place._id);

            // check the database
            connect()
              .then(db => {
                db.collection('events').findOne({_id:ObjectId(actual._id)})
                  .then(event => {
                    expect(event).not.to.be.null;
                    return Promise.resolve('');
                  })
                  .then(foo => db.collection('locations').findOne({_id:ObjectId(actual.location_id)}))
                  .then(place => {
                    expect(place).not.to.be.null;
                    done();
                  })
                  .catch(err => done(err));
              })
              .catch(err => done(err));
          });

        });
      });

      xit('404s when it should', (done) => {
        read('123', (res, actual) => {
          expect(res.statusCode).to.equal(404);
          done();
        });
      });

      xit('requires permissions for read', (done) => {
        const params = Object.assign({}, getParams, {
          path:`${getParams.path}/${e1._id}`,
          headers: Object.assign({}, getParams.headers, {
            'Authorization': 'nope'
          })
        });

        http.get(params, (res) => {
          expect(res.statusCode).to.equal(401);
          done();
        });
      });

    });

  });
});
