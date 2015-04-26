var r = require('rethinkdb');

var klaxonPostBody = require('./klaxonPostBody.js');
var reqlRedditDate = require('../reqlRedditDate.js');

module.exports = function postKlaxonReply(
    subject, parent, forfeits, reddit, conn) {

  return reddit('/api/comment').post({
    thing_id: parent.name, // not `parent`, no matter what the docs say
    text: klaxonPostBody(forfeits[0],
      // use self-forfeit template if elf who proposed the forfeit
      // is the poster who triggered it
      forfeits[0].elf == parent.author)
  }).then(function(comment){
    return r.table('klaxons').insert({
      id: comment.id,
      subject: subject.name,
      parent: {
        id: parent.id,
        author: parent.author
      },
      forfeits: forfeits.map(function(forfeit){return forfeit.id}),
      created: reqlRedditDate(comment,'created')}).run(conn);
  });
};
