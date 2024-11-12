const User = require('../models/user.model.js');
const jwtConfig = require('../config/jwt.config.js');
const tokenUtils = require('../utils/TokenUtils');
const logger = require('../utils/Logger');
const httpStatus = require('../common/HttpStatusCodes');
const errorCode = require('../common/ErroCodes');
const jwt = require("jsonwebtoken");

// SIGNIN user
exports.signin = (req, res) => {
  const username = req.body.username;
  User.findOne({ username }, (err, user) => {
    if (err) {
      // **** LOG **** //
      logger.log('POST', '/user/signin', username, err, false);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ data: {}, errors: [errorCode.ERR0000, err] });
    } else if (user) {
      user.comparePassword(req.body.password, (err, isMatch) => {
        if (err) {
          // **** LOG **** //
          logger.log('POST', '/user/signin', username, err, false);
          return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ data: {}, errors: [errorCode.ERR0000, err] });
        } else if (isMatch) {
          const token = jwt.sign({ id: user._id, username: user.username, userType: user.userType }, jwtConfig.secretKey, { expiresIn: jwtConfig.jwtExpiration });
          const userInfo = {
            id: user._id,
            name: user.name,
            lastname: user.lastname,
            username: user.username,
            userType: user.userType,
          }
          // **** LOG **** //
          logger.log('POST', '/user/signin', username);
          res.status(httpStatus.ACCEPTED).send({ data: { token: token, user: userInfo }, errors: [], });
        } else {
          // **** LOG **** //
          logger.log('POST', '/user/signin', username, errorCode.ERR0017.title, false);
          return res.status(httpStatus.UNAUTHORIZED).send({ data: {}, errors: [errorCode.ERR0017], });
        }
      });
    } else {
      // **** LOG **** //
      logger.log('POST', '/user/signin', username, errorCode.ERR0001.title, false);
      return res.status(httpStatus.NOT_FOUND).send({ data: {}, errors: [errorCode.ERR0001], });
    }
  });
}

// CREATE user
exports.signup = (req, res) => {
  const userId = tokenUtils.decodeToken(req.headers['authorization']).id;
  const currentuser = tokenUtils.decodeToken(req.headers['authorization']).username;
  const { name, lastname, username, password, userType } = req.body;
  const createdBy = userId;
  const user = new User({
    name,
    lastname,
    username,
    password,
    userType,
    createdBy,
    createdAt: new Date()
  });
  user
    .save()
    .then(() => {
      user.password = "";
      // **** LOG **** //
      logger.log('POST', '/user/signup', currentuser);
      res.status(httpStatus.CREATED).send({ data: user, errors: [] });
    })
    .catch((err) => {
      // **** LOG **** //
      logger.log('POST', '/user/signup', currentuser, err, false);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ data: {}, errors: [err.code == 11000 ? errorCode.ERR0007 : errorCode.ERR0000] })
    })
}

// UPDATE user
exports.update = (req, res) => {
  const { id } = req.params;
  const userId = tokenUtils.decodeToken(req.headers['authorization']).id;
  const currentuser = tokenUtils.decodeToken(req.headers['authorization']).username;
  const { name, lastname, username, password, userType } = req.body;
  const updatedBy = userId;
  const user = {
    name,
    lastname,
    username,
    password,
    userType,
    updatedBy,
    updatedAt: new Date()
  }
  User.updateOne({ _id: id }, { $set: user })
    .then((user) => {
      // **** LOG **** //
      logger.log('UPDATE', `/user/${id}`, currentuser);
      res.status(httpStatus.OK).send({ data: user, errors: [] });
    })
    .catch((err) => {
      // **** LOG **** //
      logger.log('UPDATE', `/user/${id}`, currentuser, err, false);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ data: {}, errors: [errorCode.ERR0000, err] })
    })
}

// DELETE user
exports.delete = (req, res) => {
  const { id } = req.params;
  const currentuser = tokenUtils.decodeToken(req.headers['authorization']).username;
  User.deleteOne({ _id: id })
    .then((user) => {
      // **** LOG **** //
      logger.log('DELETE', `/user/${id}`, currentuser);
      res.status(httpStatus.OK).send({ data: user, errors: [] });
    })
    .catch((err) => {
      // **** LOG **** //
      logger.log('DELETE', `/user/${id}`, currentuser, err, false);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ data: {}, errors: [errorCode.ERR0000, err] })
    })
}

// GET users
exports.getUsers = (req, res) => {
  const currentuser = tokenUtils.decodeToken(req.headers['authorization']).username;
  User.find()
    .then((users) => {
      // **** LOG **** //
      logger.log('GET', '/users', currentuser, users.length);
      res.status(httpStatus.OK).send({ data: users, errors: [] });
    })
    .catch((err) => {
      // **** LOG **** //
      logger.log('GET', '/users', currentuser, err, false);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ data: {}, errors: [errorCode.ERR0000, err] })
    })
}

// GET user by id
exports.getUser = (req, res) => {
  const { id } = req.params;
  const currentuser = tokenUtils.decodeToken(req.headers['authorization']).username;
  User.findById(id)
    .then((user) => {
      // **** LOG **** //
      logger.log('GET', `/user/${id}`, currentuser);
      res.status(httpStatus.OK).send({ data: user, errors: [] });
    })
    .catch((err) => {
      // **** LOG **** //
      logger.log('GET', `/user/${id}`, currentuser, err, false);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ data: {}, errors: [errorCode.ERR0000, err] })
    })
}

// GET simple data user by id
exports.getUserSimple = (req, res) => {
  const { id } = req.params;
  const currentuser = tokenUtils.decodeToken(req.headers['authorization']).username;
  User.findById(id)
    .then((user) => {
      const simpleUser = {
        name: user.name,
        lastname: user.lastname,
        username: user.username
      }
      // **** LOG **** //
      logger.log('GET', `/user/${id}`, currentuser);
      res.status(httpStatus.OK).send({ data: simpleUser, errors: [] });
    })
    .catch((err) => {
      // **** LOG **** //
      logger.log('GET', `/user/${id}`, currentuser, err, false);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ data: {}, errors: [errorCode.ERR0000, err] })
    })
}