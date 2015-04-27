var forfeitRegExp = require('./forfeitRegExp.js');

module.exports = function forfeitAlreadyPresent(combo, forfeit) {
  var regex = forfeitRegExp(forfeit);
  var parent = combo.comment || combo.article;
  if (parent && regex.test(parent.body)) return true;
  for (var i=0; i < combo.replies.length; i++) {
    if (regex.test(combo.replies[i].body)) return true;
  }
  return false;
};
