const moment = require('moment-timezone');

exports.date = () => {
  return moment().tz("America/Mazatlan").format();
}

// exports.date = () => {
//   return moment().tz("America/Chihuahua").subtract(1, 'days').format();
// }

// exports.date = () => {
//   // Obtener fecha actual en UTC y luego convertir a zona horaria de Chihuahua
//   return moment.utc().tz("America/Chihuahua").format();
// }