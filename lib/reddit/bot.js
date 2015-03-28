var reddit = require('./base.js');

module.exports = function(cfg){
  return reddit(cfg, 'permanent', [ 'identity', 'privatemessages', 'read' ]);
};
