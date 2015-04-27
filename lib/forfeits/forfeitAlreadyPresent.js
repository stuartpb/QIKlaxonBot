var forfeitRegExp = require('./lib/forfeit/forfeitRegExp.js');

module.exports = function forfeitAlreadyPresent(combo, forfeit) {
  var regex = forfeitRegExp(forfeit);
  if (combo.article && regex.test(combo.article.body)) return true;
  for (var i=0; i < combo.replies.length; i++) {
    if (regex.test(combo.replies[i].body)) return true;
  }
  return false;
};
