const request = require('request-promise');

function parse(id) {
  const options = {
    uri: `http://localhost:3000/${id}`,
    json: true,
    headers: {
      'Content-Type':'application/json'
    }
  };

  return request(options);
}

module.exports = {
  parse
};
