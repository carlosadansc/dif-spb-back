const User = require("../models/user.model.js");
const AuthConfig = require("../config/auth.config.js");
const TokenUtils = require('../utils/TokenUtils');
const Logger = require('../utils/Logger');
const jwt = require("jsonwebtoken");

// LOGIN user
exports.login = (req, res) => {
  const username = req.body.username;
  User.findOne({ username }, (err, user) => {
    if (err) {
      // **** LOG **** //
      Logger.log('POST', '/auth', username, err, false);
      res.status(500).json({ error: 'internalError', message: "Error: " + err });
    } else if (user) {
      user.comparePassword(req.body.password, (err, isMatch) => {
        if (err) {
          // **** LOG **** //
          Logger.log('POST', '/auth', username, err, false);
          res.status(500).json({ error: 'internalError', message: "Error: " + err });
        } else if (isMatch) {
          const token = jwt.sign({ id: user._id, username: user.username }, AuthConfig.secretKey, { expiresIn: AuthConfig.jwtExpiration });
          const userInfo = {
            id: user._id,
            name: user.name,
            lastname: user.lastname,
            username: user.username,
          }
          // **** LOG **** //
          Logger.log('POST', '/auth', username);
          res.status(200).json({ token, user: { ...userInfo } });
        } else {
          // **** LOG **** //
          Logger.log('POST', '/auth', username, 'Password incorrect', false);
          res.status(500).json({ error: 'incorrectPassword', message: "La contraseña no es válida" });
        }
      });
    } else {
      // **** LOG **** //
      Logger.log('POST', '/auth', username, 'User not found', false);
      res.status(400).json({ error: 'userNotFound', message: "Usuario no encontrado" });
    }
  });
}

// CREATE user
exports.create = (req, res) => {
  const { name, lastname, username, password } = req.body;
  const user = new User({
    name,
    lastname,
    username,
    password,
  });
  user
    .save()
    .then(() => {
      // **** LOG **** //
      Logger.log('POST', '/users/register', username);
      res.json("User created!")
    })
    .catch((err) => {
      // **** LOG **** //
      Logger.log('POST', '/users/register', username, err, false);
      res.status(500).json({ error: 'internalError', message: "Error: " + err })
    })
}

// UPDATE user
exports.update = (req, res) => {
  const { id } = req.params;
  const { name, lastname, username, password } = req.body;
  const user = {
    name,
    lastname,
    username,
    password,
    updatedAt: new Date()
  }
  User.updateOne({ _id: id }, { $set: user })
    .then((user) => {
      // **** LOG **** //
      Logger.log('UPDATE', `/users/${id}`, username);
      res.status(200).json(user)
    })
    .catch((err) => {
      // **** LOG **** //
      Logger.log('UPDATE', `/users/${id}`, username, err, false);
      res.status(500).json({ error: 'internalError', message: "Error: " + err })
    })
}

// DELETE user
exports.delete = (req, res) => {
  const { id } = req.params;
  User.deleteOne({ _id: id })
    .then((user) => {
      // **** LOG **** //
      Logger.log('DELETE', `/users/${id}`, user.username);
      res.status(200).json(user)
    })
    .catch((err) => {
      // **** LOG **** //
      Logger.log('DELETE', `/users/${id}`, user.username, err, false);
      res.status(500).json({ error: 'internalError', message: "Error: " + err })
    })
}

// GET users
exports.getUsers = (req, res) => {
  User.find()
    .then((users) => {
      // **** LOG **** //
      Logger.log('GET', '/users', users.length);
      res.status(200).json(users)
    })
    .catch((err) => {
      // **** LOG **** //
      Logger.log('GET', '/users', '', err, false);
      res.status(500).json({ error: 'internalError', message: "Error: " + err })
    })
}

// GET user by id
exports.getUser = (req, res) => {
  const { id } = req.params;
  User.findById(id)
    .then((user) => {
      // **** LOG **** //
      Logger.log('GET', `/users/${id}`, user.username);
      res.status(200).json(user)
    })
    .catch((err) => {
      // **** LOG **** //
      Logger.log('GET', `/users/${id}`, '', err, false);
      res.status(500).json({ error: 'internalError', message: "Error: " + err })
    })
}