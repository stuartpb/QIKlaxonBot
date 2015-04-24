var express = require('express');
var crypto = require('crypto');
var session = require('express-session');
var RedisStore = require('connect-redis')(session);
var redditAuth = require('./lib/reddit/auth.js');
var redditBot = require('./lib/reddit/bot.js');
var r = require('rethinkdb');
var endex = require('endex');

var botName = 'QIKlaxonBot';

module.exports = function appctor(cfg) {
  var redditCfg = cfg.reddit;
  redditCfg.domain = cfg.env.CANONICAL_HOST;

  var authReddit = redditAuth(redditCfg);
  var botAuthReddit = redditBot(redditCfg);
  var conn;

  r.connect(cfg.rethinkdb).then(function (connection) {
    conn = connection;
    return endex.db('qiklaxonbot')
      .table('users', {primaryKey: 'name'})
      .table('klaxons')
        .index('comment')
        .index('elf')
      .table('comments')
      .run(conn);
  });

  function authRedditUser(req, res) {
    var userAuthReddit = redditAuth(cfg.reddit);
    userAuthReddit.auth(req.query.code).then(function (refreshToken) {
      return userAuthReddit('/api/v1/me').get();
    }).then(function (data) {
      return userAuthReddit.deauth()
      .then(r.table('users').insert(
        {name: data.name, lastLogin: r.now()},
        {conflict: 'update'}).run(conn))
      .then(function () {
        if (data.name == botName) {
          req.session.bot = crypto.randomBytes(64).toString('hex');
          res.redirect(botAuthReddit.getExplicitAuthUrl(req.session.bot));
        } else {
          req.session.username = data.name;
          res.redirect('/');
        }
      });
    });
  }

  function authBot(req, res) {
    botAuthReddit.auth(req.query.code).then(function (refreshToken) {
      return botAuthReddit.deauth()
      .then(r.table('users').get(botName)
        .update({refreshToken: refreshToken}).run(conn))
      .then(function () {
        // "log out" and redirect to the index
        // so we can log in as ourselves
        delete res.session.username;
        delete res.session.bot;
        res.redirect('/');
      });
    });
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
      res.render('dashboard.jade',{user: req.session.username});
    } else {
      res.render('guest.jade');
    }
  });
  app.get('/elves/login', function (req, res) {
    res.redirect(authReddit.getExplicitAuthUrl());
  });
  app.get('/auth/reddit', function (req, res) {
    if (req.query.state && req.query.state == req.session.bot) {
      authBot(req, res);
    } else {
      authRedditUser(req, res);
    }
  });

  return app;
};
