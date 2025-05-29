const getDate = require('./GetDate');
const winston = require('winston');

// Create the logger instance once outside the function
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    // winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: './logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: './logs/success.log', level: 'info' }),
    new winston.transports.File({ filename: './logs/all.log' }),
  ],
});

exports.log = (HttpType, route, useremail, error, success = true) => {
  const { date, time } = getDateNow();
  const logMessage = `${HttpType} ${route} : ${useremail} : ${success ? 'SUCCESS' : 'ERROR'} : ${date} ${time}`;
  
  console.log(`[${HttpType} ${route}] : ${useremail} : ${success ? 'SUCCESS' : 'ERROR'} : ${date} ${time}`);
  
  // Log to the appropriate level
  if (success) {
    logger.info(logMessage);
  } else {
    logger.error(logMessage + (error ? ` - ${error}` : ''));
  }
};

function getDateNow() {
  const datenow = getDate.date();
  let [date, time] = datenow.split('T');
  time = time.slice(0, 8);
  return { date, time };
}