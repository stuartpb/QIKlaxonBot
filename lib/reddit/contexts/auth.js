var reddit = require('./base.js');

module.exports = function(cfg){
  return reddit(cfg, 'temporary', [ 'identity' ]);
};
