const getDate = require('./GetDate')

exports.log = (HttpType, route, useremail, error, success = true) => {
  const { date, time } = getDateNow();
  if(success) console.log(`[${HttpType} ${route}] : ${useremail} : SUCCESS : ${date} ${time}`);
  else console.log(`[${HttpType} ${route}] : ${useremail} : ERROR : ${date} ${time} : ${error}`);
}

function getDateNow() {
  const datenow = getDate.date();
  let [date, time] = datenow.split('T');
  time = time.slice(0, 8);
  return { date, time };
}