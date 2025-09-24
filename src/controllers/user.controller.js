const User = require('../models/user.model.js');
const tokenUtils = require('../utils/TokenUtils');
const logger = require('../utils/Logger');
const httpStatus = require('../common/HttpStatusCodes');
const errorCode = require('../common/ErroCodes');
const GetDate = require('../utils/GetDate')

// SIGNIN user
exports.signin = async (req, res) => {
  // Validación de entrada
  if (!req.body.username || !req.body.password) {
    logger.log('POST', '/user/signin', req.body.username, errorCode.ERR0020.title, false);
    return res.status(httpStatus.BAD_REQUEST).json({ data: {}, errors: [errorCode.ERR0020] });
  }

  const { username, password } = req.body;
  const sanitizedUsername = username.trim().toLowerCase();

  try {
    // Buscar usuario con el área poblada
    const user = await User.findOne({ username: sanitizedUsername, deleted: false })
      .populate('area', 'name') // Solo traer el campo name del área
      .select('+password');
    
    if (!user) {
      logger.log('POST', '/user/signin', sanitizedUsername, errorCode.ERR0001.title, false);
      return res.status(httpStatus.NOT_FOUND).json({ data: {}, errors: [errorCode.ERR0001] });
    }

    // Verificar si el usuario está activo
    if (!user.active) {
      logger.log('POST', '/user/signin', sanitizedUsername, 'Intento de inicio de sesión de usuario inactivo', false);
      return res.status(httpStatus.UNAUTHORIZED).json({ 
        data: {}, 
        errors: [{ 
          code: 'ERR0021', 
          title: 'Usuario inactivo', 
          detail: 'El usuario se encuentra inactivo en el sistema' 
        }] 
      });
    }

    // Comparar contraseña
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      logger.log('POST', '/user/signin', sanitizedUsername, errorCode.ERR0017.title, false);
      return res.status(httpStatus.UNAUTHORIZED).json({ data: {}, errors: [errorCode.ERR0017] });
    }

    // Generar token y respuesta
    const token = tokenUtils.generateJWT(user);
    const userInfo = tokenUtils.extractUserInfo(user);
    
    logger.log('POST', '/user/signin', sanitizedUsername);
    res.status(httpStatus.ACCEPTED).json({ data: { token, user: userInfo }, errors: [] });

  } catch (err) {
    logger.log('POST', '/user/signin', sanitizedUsername, err, false);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ data: {}, errors: [errorCode.ERR0000, err.message] });
  }
};

// CREATE user
exports.signup = (req, res) => {
  const userId = tokenUtils.decodeToken(req.headers['authorization']).id;
  const currentuser = tokenUtils.decodeToken(req.headers['authorization']).username;
  const { name, lastname, position, area, username, password, userType } = req.body;
  const createdBy = userId;
  const user = new User({
    name,
    lastname,
    position,
    area,
    username,
    password,
    userType,
    createdBy,
    createdAt: GetDate.date()
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
  const { update } = req.body;
  const updatedBy = userId;
  const user = {
    ...update,
    updatedBy,
    updatedAt: GetDate.date()
  }
  User.findByIdAndUpdate(id, user, { new: true })
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
        position: user.position,
        area: user.area,
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