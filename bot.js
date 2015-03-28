var botReddit = require('./lib/reddit/bot.js');
var r = require('rethinkdb');

module.exports = function botctor(cfg) {
  var reddit = botReddit(cfg.reddit);
};
