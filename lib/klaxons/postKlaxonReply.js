var r = require('rethinkdb');

var klaxonPostBody = require('./klaxonPostBody.js');
var reqlRedditDate = require('../reqlRedditDate.js');

module.exports = function postKlaxonReply(
    subject, reply, forfeits, reddit, conn) {

  return reddit('/api/comment').post({
    parent: reply.name, //or is it `thing_id`? DOCSSSSSS
    text: klaxonPostBody(forfeits[0],
      // use self-forfeit template if elf who proposed the forfeit
      // is the poster who triggered it
      forfeits[0].elf == reply.author)
  }).then(function(comment){
    return r.table('klaxons').insert({
      id: comment.id,
      subject: subject.name,
      reply: reply.name,
      forfeits: forfeits.map(function(forfeit){return forfeit.id}),
      created: reqlRedditDate(comment,'created')}).run(conn);
  });
};
