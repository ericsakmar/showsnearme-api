const config = require('../config');

const auth = {
  mustBe: function() {
    const roles = Array.from(arguments)
      .map(role => role.toUpperCase())
      .map(role => role + '_TOKEN');

    return function(req, res, next) {

      if (config.env === 'development') {
        // don't check for keys when in dev mode
        next();
      }
      else {

        const key = req.headers.authorization;

        const authorized = roles
          .map((r) => process.env[r])
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
}

module.exports = auth;
