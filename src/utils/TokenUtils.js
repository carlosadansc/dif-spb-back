const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt.config.js');


exports.decodeToken = (header) => {
  let token = header;
  token = token.replace('Bearer ', '');
  return jwt.decode(token);
}

exports.generateJWT = (user) => {
  return jwt.sign(
    { 
      id: user._id, 
      username: user.username, 
      userType: user.userType 
    }, 
    jwtConfig.secretKey, 
    { expiresIn: jwtConfig.jwtExpiration }
  );
}

exports.extractUserInfo = (user) => {
  return {
    id: user._id,
    name: user.name,
    lastname: user.lastname,
    position: user.position,
    area: user.area,
    username: user.username,
    userType: user.userType,
  };
}
