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
  
  // Verifica si el usuario es administrador
  verifyAdmin: (req, res, next) => {
    let token = req.headers['authorization'];
    if (!token) {
      logger.log(req.method, req._parsedUrl.pathname, 'anonymous', errorCode.ERR0018.title, false);
      return res.status(httpStatus.UNAUTHORIZED).send({ data: {}, errors: [errorCode.ERR0018] });
    }
    token = token.replace('Bearer ', '');
    const username = tokenUtils.decodeToken(req.headers['authorization']).username; 
    
    jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
      if (err) {
        if (err instanceof TokenExpiredError) {
          logger.log(req.method, req._parsedUrl.pathname, username, errorCode.ERR0019.title, false);
          return res.status(httpStatus.FORBIDDEN).send({ data: {}, errors: [errorCode.ERR0019] });
        } else {
          logger.log(req.method, req._parsedUrl.pathname, username, errorCode.ERR0018.title, false);
          return res.status(httpStatus.UNAUTHORIZED).send({ data: {}, errors: [errorCode.ERR0018] });
        }
      }
      
      // Solo los administradores pueden acceder
      if (decoded.userType !== 'admin') {
        logger.log(req.method, req._parsedUrl.pathname, username, 'No tiene permisos de administrador', false);
        return res.status(httpStatus.FORBIDDEN).send({ 
          data: {}, 
          errors: [{
            code: 'ERR0021',
            title: 'Acceso denegado',
            detail: 'Se requieren permisos de administrador para acceder a este recurso'
          }] 
        });
      }
      
      next();
    });
  },

  // //////////////////////////////////////////////////////////////////////////////
  // //////////////////////////////////////////////////////////////////////////////
  
  // Verifica si el usuario es ejecutivo o administrador
  verifyExecutive: (req, res, next) => {
    let token = req.headers['authorization'];
    if (!token) {
      logger.log(req.method, req._parsedUrl.pathname, 'anonymous', errorCode.ERR0018.title, false);
      return res.status(httpStatus.UNAUTHORIZED).send({ data: {}, errors: [errorCode.ERR0018] });
    }
    token = token.replace('Bearer ', '');
    const username = tokenUtils.decodeToken(req.headers['authorization']).username;
    
    jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
      if (err) {
        if (err instanceof TokenExpiredError) {
          logger.log(req.method, req._parsedUrl.pathname, username, errorCode.ERR0019.title, false);
          return res.status(httpStatus.FORBIDDEN).send({ data: {}, errors: [errorCode.ERR0019] });
        } else {
          logger.log(req.method, req._parsedUrl.pathname, username, errorCode.ERR0018.title, false);
          return res.status(httpStatus.UNAUTHORIZED).send({ data: {}, errors: [errorCode.ERR0018] });
        }
      }
      
      // Verificar si el usuario es admin o ejecutivo
      if (!['admin', 'executive'].includes(decoded.userType)) {
        logger.log(req.method, req._parsedUrl.pathname, username, 'No tiene permisos de ejecutivo o administrador', false);
        return res.status(httpStatus.FORBIDDEN).send({ 
          data: {}, 
          errors: [{
            code: 'ERR0022',
            title: 'Permisos insuficientes',
            detail: 'Se requieren permisos de ejecutivo o administrador para acceder a este recurso'
          }] 
        });
      }
      
      next();
    });
  }
}