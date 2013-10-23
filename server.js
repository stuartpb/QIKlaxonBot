var pkg = require('./package.json');
var rereddit = require('rereddit');

rereddit.user_agent = "StuartPBentley-QIKlaxonBot/" + pkg.version;

var asUser;

var commentsToCheck;

var lastCommentCheck;

function rotateComments() {
  commentsToCheck.push(commentsToCheck.shift());
}

rereddit.login(process.env.REDDIT_USERNAME, process.env.REDDIT_PASSWORD)
  .end(function(err, user) { asUser = user });

function parseForNewComments(err,inbox) {
  
}

function queryReddit() {
  if (asUser){
    if(commentsToCheck){
      
    } else {
      rereddit.as(asUser).inbox(parseForNewComments);
    }
  }
}

setInterval(queryReddit,2000);
