var botReddit = require('./lib/reddit/contexts/bot.js');
var r = require('rethinkdb');
var queries = require('./lib/bot/queries.js');
var getSubjectReplies = require('./lib/reddit/getSubjectReplies.js');
var mapForfeitRegExps = require('./lib/klaxons/mapForfeitRegExps.js');
var postKlaxonReply = require('./lib/klaxons/postKlaxonReply.js');

var botName = 'QIKlaxonBot';

module.exports = function botctor(cfg) {
  var reddit = botReddit(cfg.reddit);
  var conn;

  function kickoff() {
    r.connect(cfg.rethinkdb).then(function (connection) {
      conn = connection;
      return r.table('users').get(botName).changes().run(conn);
    }).then(function(cursor){
      function checkForRefreshToken(changes) {
        var user = changes.new_val;

        // If we have a refresh token specified
        if (user && user.refreshToken) {
          // once we have a refresh token, stop listening to changes regarding
          // the existence of a refresh token
          cursor.close();
          // auth to Reddit and start polling subjects
          reddit.refresh(user.refreshToken).then(pollMostUrgentSubject);

        // if we don't have a refresh token yet
        } else {
          // check again next time we modify the bot's user record
          cursor.next(checkForRefreshToken);
        }
      }
      cursor.next(checkForRefreshToken);
    });
  }

  function pollMostUrgentSubject() {
    var subject;
    function checkReplies(response) {
      var replies = response.replies;
      var forfeitRegExps = mapForfeitRegExps(subject.forfeits);
      var matchedForfeits;
      var pendingPromise;
      for (var i=0; i < replies.length; i++){
        matchedForfeits = [];
        for (var j=0; j < forfeitRegExps.length; j++) {
          // if this post matches the forfeit
          if (forfeitRegExps[j].test(replies[i].body) &&
            // and we haven't already posted a klaxon on it
            ~subject.forfeits[j].reply_klaxons.indexOf(replies[i].id)) {
            // TODO: consolidate all forfeits into one post
            // TODO: get klaxons for replies per-subject, not per-forfeit
            // TODO: branch on existence of forfeit
            //       (don't handle old forfeits like they could be new)
            // TODO: edit klaxon to append forfeits introduced by new edits
            // TODO: if forfeit was submitted by the user who posted this,
            //       withdraw the forfeit
            matchedForfeits[0] = subject.forfeits[j].id;
            var postPromise = postKlaxonReply(
              subject,replies[i],matchedForfeits,reddit,conn);
            if (pendingPromise) {
              // I'm not actually sure that I have to do the assignment here -
              // best not to risk it.
              pendingPromise = pendingPromise.then(postPromise);
            } else {
              pendingPromise = postPromise;
            }
          }
        }
      }
      if (pendingPromise) {
        return pendingPromise.then(pollMostUrgentSubject);
      } else return pollMostUrgentSubject();
    }
    queries.mostUrgentSubject.run(conn).then(function(mostUrgent){
      if (mostUrgent) {
        subject = mostUrgent;
        return r.table('subjects').get(subject.name)
          .update({last_checked: r.now()}).run(conn)
          .then(getSubjectReplies(reddit,subject))
          .then(checkReplies);

      // if there are no comments to check, wait a second and try again
      } else return setTimeout(pollMostUrgentSubject,1000);
    });
  }

  return kickoff;
};
