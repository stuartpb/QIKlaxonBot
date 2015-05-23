var Snoocore = require('snoocore');

var pkg = require('../../../package.json');

var uaString = "QIKlaxonBot/" + pkg.version + ' (by /u/StuartPBentley)';

module.exports = function(cfg, duration, scopes){
  return new Snoocore({
    userAgent: uaString,
    decodeHtmlEntities: true,
    oauth: {
      type: 'explicit',
      duration: duration,
      key: cfg.appId,
      secret: cfg.secret,
      redirectUri: 'https://' +
        (cfg.domain || 'qiklaxonbot.redditbots.com') +
        '/auth/reddit',
      scope: scopes
    }
  });
};
