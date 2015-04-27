module.exports = function forfeitRegExp(forfeit){
  if (forfeit.regex) return new RegExp(forfeit.regex,'i');
  else return new RegExp('\\b'+ forfeit.phrase.replace(
    /[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '\\b','i');
};
