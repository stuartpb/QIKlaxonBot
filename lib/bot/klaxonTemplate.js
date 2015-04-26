function qiKlaxonLink(phrase) {
  return 'http://qiklaxon.com/#'+encodeURIComponent(phrase);
}

var ohDear = "Oh dear...";
var annoyedGrunt = "D'oh!";
var ourLittleElves = "Our little elves thought you'd say that";
var selfElf = "You cunningly set a trap for yourself";

module.exports = function klaxonPostBody(forfeit,opts) {
  opts = opts || {};
  var prelude = (opts.self ? annoyedGrunt : ohDear);
  var postscript = (opts.self ? selfElf : ourLittleElves);
  return '*' + prelude + '*\n\n---\n---\n\n>> ## **[' +
    forfeit.phrase.toUpperCase() + '](' +
    qiKlaxonLink(forfeit.phrase) + ')** ##\n\n---\n---\n\n' +
    '^(*' + postscript + ' ' + forfeit.date.toUTCString() +
    '* - [about][1])\n\n' +
    '[1]: https://www.reddit.com/r/QIKlaxonBot/wiki/index';
};
