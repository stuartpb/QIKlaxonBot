var express = require('express');
var session = require('express-session');
var RedisStore = require('connect-redis')(session);
var r = require('rethinkdb');
var endexDb = require('./lib/endexDb.js');

module.exports = function appctor(cfg) {
  var redditCfg = cfg.reddit;
  redditCfg.domain = cfg.env.CANONICAL_HOST;
  redditCfg.botName = 'QIKlaxonBot';

  var conn;

  r.connect(cfg.rethinkdb).then(function (connection) {
    conn = connection;
    return endexDb(conn);
  });

  var redditAuthUrl = require(
    './lib/reddit/contexts/auth.js')(redditCfg).getExplicitAuthUrl();

  // These might be better described as "conditionally-determined route
  // handlers" than "middleware", but I'm saying that anything that
  // uses the (req, res) signature is "middleware", for the purposes of
  // naming.
  var authBot = require('./lib/middleware/authBot.js')(redditCfg, conn);
  var authRedditUser = require(
    './lib/middleware/authRedditUser.js')(redditCfg, conn);

  function requireLogin(req, res, next) {
    if (req.session.username) return next();
    else return res.redirect('/');
  }

  var app = express();
  app.use(express.static(__dirname + '/static'));
  app.use(session({
      store: new RedisStore({
        host: cfg.redis.hostname,
        port: cfg.redis.port}),
      secret: cfg.reddit.secret
  }));
  app.use(function (req, res, next) {
    if (!req.session) {
      return next(new Error("couldn't find sessions"));
    }
    else return next();
  });
  app.get('/', function (req, res) {
    if (req.session.username) {
      // TODO: get user's forfeits
      res.render('dashboard.jade',{user: req.session.username});
    } else {
      res.render('guest.jade');
    }
  });
  app.get('/elves/login', function (req, res) {
    res.redirect(redditAuthUrl);
  });
  app.get('/auth/reddit', function (req, res) {
    if (req.query.state && req.query.state == req.session.bot) {
      authBot(req, res);
    } else {
      authRedditUser(req, res);
    }
  });
  app.get('/forfeits/new', requireLogin, function (req, res) {
    res.render('new-forfeit.jade',{user: req.session.username});
  });
  // TODO: save posted forfeit until user logs in if user is not logged in
  app.post('/forfeits/new', requireLogin, function (req, res) {

    // TODO: save forfeit to database
    res.redirect('/');
  });

  return app;
};
