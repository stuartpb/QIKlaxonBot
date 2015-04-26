module.exports = function getSubjectReplies(reddit,subject){
  var opts = {};
  if (subject.comment) {
    opts.comment = subject.comment;
    opts.depth = 2;
    opts.context = 0;
  } else {
    opts.depth = 1;
  }
  return reddit('/comments/'+subject.article+'.json').get(opts)
    .then(function (result) {

    var combo = {
      article: result[0].data.children[0].data
    };

    if (subject.comment) {
      combo.comment = result[1].data.children[0].data;
      // if there are no replies, the 'replies' field will be
      // an empty *string*, not a listing / array, because Reddit.
      combo.replies = combo.comment.replies ?
        combo.comment.replies.data.children : [];
    } else {
      combo.replies = result[1].data.children;
    }

    // TODO: handle morecomments
    if (combo.replies.length > 0 &&
      combo.replies[combo.replies.length-1].kind == 'more') {

      combo.replies.pop();
    }

    // Unwrap replies
    for (var i=combo.replies.length-1; i>=0; i--) {
      combo.replies[i] = combo.replies[i].data;
    }

    return combo;
  });
};
