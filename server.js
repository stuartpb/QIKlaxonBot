#! /usr/bin/env node

var cfg = require('envigor')();

var launchBot = process.argv.indexOf('--bot') > 1;

require('http')
  .createServer(require('./index.js')(cfg))
  .listen(cfg.port || 3000, cfg.ip);

if (launchBot) require('./bot.js')(cfg)();
