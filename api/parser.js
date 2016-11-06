const request = require('request');

function parse(id) {
  // const options = {
  //   uri: `http://localhost:3001/${id}`,
  //   json: true,
  //   headers: {
  //     'Content-Type':'application/json'
  //   }
  // };

  // request(options)
  //   .then(e => console.log(e))
  // .catch(e => console.log(e));

  request(`http://parser:3000/${id}`, (err, res, body) => {
    console.log('err');
    console.log(err);

    console.log('body');
    console.log(body);
  });
}

module.exports = {
  parse
};
