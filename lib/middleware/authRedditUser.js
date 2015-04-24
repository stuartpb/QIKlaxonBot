var crypto = require('crypto');
var r = require('rethinkdb');
var redditAuth = require('../reddit/contexts/auth.js');
var botAuth = require('../reddit/contexts/bot.js');

module.exports = function authRedditUserCtor(cfg, conn) {
  var botAuthReddit = botAuth(cfg);

  return function authRedditUser(req, res) {
    var userAuthReddit = redditAuth(cfg);
    userAuthReddit.auth(req.query.code).then(function (refreshToken) {
      return userAuthReddit('/api/v1/me').get();
    }).then(function (data) {
      return userAuthReddit.deauth()
      .then(r.table('users').insert(
        {name: data.name, lastLogin: r.now()},
        {conflict: 'update'}).run(conn))
      .then(function () {
        if (data.name == cfg.botName) {
          req.session.bot = crypto.randomBytes(64).toString('hex');
          res.redirect(botAuthReddit.getExplicitAuthUrl(req.session.bot));
        } else {
          req.session.username = data.name;
          res.redirect('/');
        }
      });
    });
  };
};