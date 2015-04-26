// TODO: handle redd.it shortlinks
var reCommentsUrl = new RegExp(
  // match hosts on reddit
  '^(?:https?://)?[a-zA-Z0-9\\-_]*.?reddit\\.com' +
  // optionaly get an (ignored) subreddit component
  '(?:/r/[^/]+)?' +
  // get the article ID of the comments
  '/comments/([^/]+)' +
  // optionally look for an (ignored) title and a single-comment ID
  '(?:/[^/]+/([^/]+))?', 'i');

module.exports = function parseCommentsUrl(url) {
  var result = reCommentsUrl.exec(url);

  if (result) {
    var subject = {
      article: result[1]
    };

    if (result[2]) subject.comment = result[2];

    return subject;
  } else return null;
};
