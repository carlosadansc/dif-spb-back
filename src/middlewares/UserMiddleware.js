const jwt = require('jsonwebtoken');
const tokenUtils = require('../utils/TokenUtils');
const logger = require('../utils/Logger');
const httpStatus = require('../common/HttpStatusCodes')
const errorCode = require('../common/ErroCodes')
const { TokenExpiredError } = jwt;

module.exports = {
  verifyUser: (req, res, next) => {
    let token = req.headers['authorization'];
    if (!token) {
      // **** LOG **** //
      logger.log(req.method, req._parsedUrl.pathname, 'anonymous', errorCode.ERR0018.title, false);
      return res.status(httpStatus.UNAUTHORIZED).send({ data: {}, errors: [errorCode.ERR0018], });
    }
    token = token.replace('Bearer ', '')
    const username = tokenUtils.decodeToken(req.headers['authorization']).username; 
    jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
      if (err) {
        if (err instanceof TokenExpiredError) {
          // **** LOG **** //
          logger.log(req.method, req._parsedUrl.pathname, username, errorCode.ERR0019.title, false);
          return res.status(httpStatus.FORBIDDEN).send({ data: {}, errors: [errorCode.ERR0019], });
        } else {
          // **** LOG **** //
          logger.log(req.method, req._parsedUrl.pathname, username, errorCode.ERR0018.title, false);
          return res.status(httpStatus.UNAUTHORIZED).send({ data: {}, errors: [errorCode.ERR0018], });
        }
      }
      req.user = decoded;
      next();
    });
  },

  // //////////////////////////////////////////////////////////////////////////////
  // //////////////////////////////////////////////////////////////////////////////
  
  verifyAdmin: (req, res, next) => {
    let token = req.headers['authorization'];
    if (!token) {
      // **** LOG **** //
      logger.log(req.method, req._parsedUrl.pathname, 'anonymous', errorCode.ERR0018.title, false);
      return res.status(httpStatus.UNAUTHORIZED).send({ data: {}, errors: [errorCode.ERR0018], });
    }
    token = token.replace('Bearer ', '')
    const username = tokenUtils.decodeToken(req.headers['authorization']).username; 
    jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
      if (err) {
        if (err instanceof TokenExpiredError) {
          // **** LOG **** //
          logger.log(req.method, req._parsedUrl.pathname, username, errorCode.ERR0019.title, false);
          return res.status(httpStatus.FORBIDDEN).send({ data: {}, errors: [errorCode.ERR0019], });
        } else {
          // **** LOG **** //
          logger.log(req.method, req._parsedUrl.pathname, username, errorCode.ERR0018.title, false);
          return res.status(httpStatus.UNAUTHORIZED).send({ data: {}, errors: [errorCode.ERR0018], });
        }
      }
      if (decoded.userType !== 'admin') {
        // **** LOG **** //
        logger.log(req.method, req._parsedUrl.pathname, username, 'Not an admin', false);
        return res.status(httpStatus.UNAUTHORIZED).send({ data: {}, errors: [errorCode.ERR0020], });
      }
      next();
    });
  }
}