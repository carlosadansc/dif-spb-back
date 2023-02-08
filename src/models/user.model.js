const mongoose = require('mongoose')
const bcrypt = require("bcryptjs")

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  lastname: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  userType: { type: String, required: true },
  active: { type: Boolean, required: true, default: true },
  deleted: { type: Boolean, required: true, default: false },
  createdBy: { type: String, required: true },
  updatedBy: { type: String, required: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

UserSchema.pre("save", function (next) {
  const user = this

  if (this.isModified("password") || this.isNew) {
    bcrypt.genSalt(10, function (saltError, salt) {
      if (saltError) {
        return next(saltError)
      } else {
        bcrypt.hash(user.password, salt, function(hashError, hash) {
          if (hashError) {
            return next(hashError)
          }

          user.password = hash
          next()
        })
      }
    })
  } else {
    return next()
  }
})

UserSchema.pre("updateOne", function (next) {
  const user = this
  if (user._update.$set.password) {
    bcrypt.genSalt(10, function (saltError, salt) {
      if (saltError) {
        console.log(saltError)
        return next(saltError)
      } else {
        bcrypt.hash(user._update.$set.password, salt, function(hashError, hash) {
          if (hashError) {
            console.log(hashError)
            return next(hashError)
          }
          
          user._update.$set.password = hash
          next()
        })
      }
    })
  } else {
    return next()
  }
})

UserSchema.methods.comparePassword = function(password, callback) {
  bcrypt.compare(password, this.password, function(error, isMatch) {
    if (error) {
      return callback(error)
    } else {
      callback(null, isMatch)
    }
  })
}

module.exports = mongoose.model('User', UserSchema);