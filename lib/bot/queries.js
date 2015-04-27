var r = require('rethinkdb');

// Number of seconds after which Reddit will archive an article
// (180 days): https://github.com/reddit/reddit/commit/b7b24d2e9fa06ba37ea78e0275dce86d95158e64
var archiveLimit = 180 * 24 * 60 * 60;

exports.mostUrgentSubject = r.table('subjects')
  .between(r.now().sub(archiveLimit),r.now(),{index:'article_created'})
  .orderBy(r.desc(function(subject){
    var staleness = subject('last_checked').sub(r.now());
    var age = subject('article_created').sub(r.now());
    return staleness.div(age);
  })).limit(1).merge(function(subject){ return {
    forfeits: r.table('forfeits').getAll(
      subject('name'),{index: 'subject'})
      .filter(function(forfeit){
        return r.not(forfeit('withdrawn').default(false))})
      .merge(function(forfeit){ return {
        reply_klaxons: r.table('klaxons').getAll(
          forfeit('id'),{index:'forfeits'})
          .map(function(klaxon){return klaxon('parent')('id')})
          .coerceTo('array')
        };
      }).coerceTo('array')
    };
  })(0).default(null);
