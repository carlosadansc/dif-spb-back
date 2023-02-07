const moment = require('moment-timezone');

exports.date = () => {
  return moment().tz("America/Chihuahua").format();
}