const keys = require('./keys');

const auth = {
  mustBe: function() {
    const roles = Array.from(arguments);

    return function(req, res, next) {
      const key = req.headers.authorization;

      const authorized = roles
        .map((r) => keys[r])
        .map((k) => k === key)
        .reduce((a,c) => a || c, false);

      if (authorized) {
        next();
      }
      else {
        res.status(401).json({msg:'Unauthorized'});
      }
    }
  }
}

module.exports = auth;
