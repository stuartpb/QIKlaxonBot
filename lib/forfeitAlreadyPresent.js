module.exports = function forfeitAlreadyPresent(combo, forfeit) {
  var regex = forfeit.expression || new RegExp('\\b'+ forfeit.phrase.replace(
    /[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '\\b','i');
  if (combo.article && regex.test(combo.article.body)) return true;
  for (var i=0; i < combo.replies.length; i++) {
    if (regex.test(combo.replies[i].body)) return true;
  }
  return false;
};
