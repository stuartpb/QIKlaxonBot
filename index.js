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
  var authReddit = redditAuth(cfg.reddit);
  var botAuthReddit = redditBot(cfg.reddit);
  var conn;

  r.connect(cfg.rethinkdb).then(function(connection){
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
    userAuthReddit.auth(req.query.code).then(function (refreshToken){
      return userAuthReddit('/api/v1/me').get();
    }).then(function(data){
      return r.table('users').insert({name: data.name}, {conflict: 'update'})
        .run(conn).then(function(){
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
    botAuthReddit.auth(req.query.code).then(function (refreshToken){
      r.table('users').get(botName).update({refreshToken: refreshToken})
        .run(conn).then(function() {
          res.send('SPIKE SENT');
        });
    });
  }

  var app = express();
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
    if (req.session.user) {
      res.render('dashboard.jade',{user: req.session.user});
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
