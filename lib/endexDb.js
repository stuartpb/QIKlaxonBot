var r = require('rethinkdb');
var endex = require('endex');

module.exports = function endexDb (conn) {
  return endex.db('qiklaxonbot')
    .table('users', {primaryKey: 'name'})
    .table('forfeits')
      .index('comment')
      .index('elf')
    .table('klaxons')
      .index('comment')
      .index('forfeit')
    .table('comments')
      .index('posted')
      .index('checked')
      //.index('urgency',function(comment){
      //})
    .run(conn);
};
