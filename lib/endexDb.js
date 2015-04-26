var r = require('rethinkdb');
var endex = require('endex');

module.exports = function endexDb (conn) {
  return endex.db('qiklaxonbot')
    .table('users', {primaryKey: 'name'})
    .table('forfeits')
      .index('subject')
      .index('elf')
    .table('klaxons')
      .index('subject')
      .index('reply')
      .index('forfeits', {multi: true})
    //.table('articles')
    //  .index('created')
    .table('subjects', {primaryKey:'name'})
      .index('article')
      .index('posted')
      .index('article_created')
      .index('last_checked')
    .run(conn);
};
