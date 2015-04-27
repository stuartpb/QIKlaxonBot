var r = require('rethinkdb');
var redditBot = require('../reddit/contexts/bot.js');

module.exports = function authBotCtor(cfg, env) {
  var botAuthReddit = redditBot(cfg);

  return function authBot(req, res, next) {
    botAuthReddit.auth(req.query.code).then(function (refreshToken) {
      return botAuthReddit.deauth()
      .then(function(){
        return r.table('users').get(cfg.botName)
          .update({refreshToken: refreshToken}).run(env.conn);
      })
      .then(function () {
        // "log out" and redirect to the index
        // so we can log in as ourselves
        delete req.session.username;
        delete req.session.bot;
        res.redirect('/');
      },next);
    });
  };
};
