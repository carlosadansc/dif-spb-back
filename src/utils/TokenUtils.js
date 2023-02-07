const jwt = require('jsonwebtoken');

exports.decodeToken = (header) => {
  let token = header;
  token = token.replace('Bearer ', '');
  return jwt.decode(token);
}