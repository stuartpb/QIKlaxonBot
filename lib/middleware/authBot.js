var r = require('rethinkdb');
var redditBot = require('../reddit/contexts/bot.js');

module.exports = function authBotCtor(cfg, conn) {
  var botAuthReddit = redditBot(cfg);

  return function authBot(req, res) {
    botAuthReddit.auth(req.query.code).then(function (refreshToken) {
      return botAuthReddit.deauth()
      .then(r.table('users').get(cfg.botName)
        .update({refreshToken: refreshToken}).run(conn))
      .then(function () {
        // "log out" and redirect to the index
        // so we can log in as ourselves
        delete res.session.username;
        delete res.session.bot;
        res.redirect('/');
      });
    });
  };
};
