require("dotenv").config();

module.exports = {
  secretKey: process.env.SECRET_KEY,
  jwtExpiration: process.env.EXPIRATION_TIME || '24h',
};