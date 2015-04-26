// Generate a ReQL time-with-timezone from a Reddit object with
// separate fields for UTC time and local time.
var r = require('rethinkdb');

function twoDigit(number) {
  return number < 10 ? '0' + number.toString() : number.toString();
}

function secondsToTimezone(seconds) {
  var sign = seconds < 0 ? '-' : '+';
  if (sign == '-') seconds = -seconds;
  var hours = twoDigit(Math.floor(seconds/3600));
  var minutes = twoDigit(Math.floor(seconds/60) % 60);
  return sign + hours + ':' + minutes;
}

module.exports = function reqlRedditDate(fields, base) {
  base = base || 'created';
  var utcTime = fields[base + '_utc'];
  var localTime = fields[base];
  var timezone = secondsToTimezone(localTime - utcTime);
  return r.expr({
    '$reql_type$': 'TIME',
    epoch_time: utcTime,
    timezone: timezone
  });
};
