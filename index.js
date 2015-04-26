var express = require('express');
var bodyParser = require('body-parser');
var session = require('express-session');
var RedisStore = require('connect-redis')(session);
var r = require('rethinkdb');
var endexDb = require('./lib/endexDb.js');

var parseCommentsUrl = require('./lib/reddit/parseCommentsUrl.js');
var getSubjectReplies = require('./lib/reddit/getSubjectReplies.js');
var forfeitAlreadyPresent = require('./lib/forfeitAlreadyPresent.js');
var reqlRedditDate = require('./lib/reqlRedditDate.js');

module.exports = function appctor(cfg) {
  var redditCfg = cfg.reddit;
  redditCfg.domain = cfg.env.CANONICAL_HOST;
  redditCfg.botName = 'QIKlaxonBot';

  var conn;

  r.connect(cfg.rethinkdb).then(function (connection) {
    conn = connection;
    return endexDb(conn);
  });

  // We use this reddit context to check forfeits for validity and stuff.
  // It uses the auth context so we can also use it to generate the auth URL,
  // because Snoocore's context model is weird and we might as well.
  var reddit = require('./lib/reddit/contexts/auth.js')(redditCfg);
  var redditAuthUrl = reddit.getExplicitAuthUrl();

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
    secret: cfg.reddit.secret,
    resave: true, //until tj/connect-redis#142 is implemented
    saveUninitialized: false
  }));
  app.use(function (req, res, next) {
    if (!req.session) {
      return next(new Error("couldn't find sessions"));
    }
    else return next();
  });
  app.use(bodyParser.urlencoded({ extended: false }));

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
  // TODO: if user is not logged in, save posted forfeit to session,
  //       restore when returning to this page after logging in
  app.post('/forfeits/new', requireLogin, function (req, res, next) {
    var subject = parseCommentsUrl(req.body.subject);

    // bounce if the subject URL was invalid
    if (!subject) return res.redirect('/forfeits/new?err=badsubject');

    // bounce if no phrase was entered
    if (!req.body.phrase) return res.redirect('/forfeits/new?err=nophrase');
    var forfeit = {phrase: req.body.phrase};

    return getSubjectReplies(reddit, subject).then(function(result){
      if(forfeitAlreadyPresent(result,forfeit))
        return res.redirect('/forfeits/new?err=toolate');
      else {
        var subjectName = result.comment ?
          result.comment.name : result.article.name;

        forfeit.elf = req.session.username;
        forfeit.subject = subjectName;
        forfeit.created = r.now();

        subject.name = subjectName;
        subject.article_created = reqlRedditDate(result.article,'created');
        // TODO: process all other forfeits on this post after getting the
        // replies, set last_checked to r.now, upsert
        // subject.last_checked = r.now();
        subject.last_checked = subject.article_created;

        return r.expr([
          r.table('forfeits').insert(forfeit),
          r.table('subjects').insert(subject,{conflict:'error'})
        ]).run(conn).then(function(){
          res.redirect('/');
        });
      }
    // TODO: handle reply-getting error a little more smoothly
    }).catch(next);

  });

  return app;
};
