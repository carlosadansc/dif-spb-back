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
  // Extraer solo la información necesaria del área si existe
  const areaInfo = user.area ? {
    id: user.area._id,
    name: user.area.name
  } : null;

  return {
    id: user._id,
    name: user.name,
    lastname: user.lastname,
    position: user.position,
    area: areaInfo,  // Usar el objeto areaInfo que contiene solo los campos necesarios
    username: user.username,
    userType: user.userType,
  };
}
