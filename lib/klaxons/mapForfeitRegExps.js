module.exports = function forfeitRegExps(forfeits) {
  var fres = [];
  for (var i=0; i<forfeits.length; i++){
    fres[i] = new RegExp('\\b'+ forfeits[i].phrase.replace(
      /[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '\\b','i');
  }
  return fres;
};
