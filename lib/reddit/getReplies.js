module.exports = function getReplies(reddit,subject){
  var opts = {};
  if (subject.comment) {
    opts.comment = subject.comment;
    opts.depth = 2;
    opts.context = 0;
  } else {
    opts.depth = 1;
  }
  return reddit('/comments/'+subject.article).get(opts)
    .then(function (result) {

    var combo = {
      article: result[0].data.children[0].data
    };

    if (subject.comment) {
      combo.comment = result[1].data.children[0].data;
      combo.replies = combo.comment.replies.data.children;
    } else {
      combo.replies = result[1].data.children;
    }

    // TODO: handle morecomments
    if (combo.replies[combo.replies.length].kind == 'more')
      combo.replies.pop();

    // Unwrap replies
    for (var i=combo.replies.length; i>=0; i--) {
      combo.replies[i] = combo.replies[i].data;
    }

    return combo;
  });
};
