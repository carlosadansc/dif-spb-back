const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "El nombre es obligatorio"],
      trim: true,
    },
    lastname: {
      type: String,
      required: [true, "El apellido es obligatorio"],
      trim: true,
    },
    position: {
      type: String,
      trim: true,
    },
    area: {
      type: String,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minLength: 4,
      maxLength: 20, // Añadir límite máximo
      match: [/^[a-zA-Z0-9_]+$/, "Solo caracteres alfanuméricos y guiones bajos"] // Restringir caracteres
    },
    password: {
      type: String,
      required: true,
      select: false, // No se devuelve en consultas
      validate: {
        validator: (v) => /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(v),
        message: "La contraseña debe tener al menos 8 caracteres con letras y números",
      },
    },
    userType: {
      type: String,
      required: true,
      enum: ["admin", "user", "manager"],
      default: "user",
    },
    active: {
      type: Boolean,
      default: true,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: String,
      required: true,
    },
    updatedBy: {
      type: String,
    },
  },
  {
    timestamps: true, // Agrega createdAt y updatedAt automáticos
    versionKey: false, // Elimina __v
  }
);

// Índices
UserSchema.index({ username: 1 });
UserSchema.index({ userType: 1 });

UserSchema.pre("save", function (next) {
  const user = this;

  if (this.isModified("password") || this.isNew) {
    bcrypt.genSalt(10, function (saltError, salt) {
      if (saltError) {
        return next(saltError);
      } else {
        bcrypt.hash(user.password, salt, function (hashError, hash) {
          if (hashError) {
            return next(hashError);
          }

          user.password = hash;
          next();
        });
      }
    });
  } else {
    return next();
  }
});

UserSchema.pre("updateOne", function (next) {
  const user = this;
  if (user._update.$set.password) {
    bcrypt.genSalt(10, function (saltError, salt) {
      if (saltError) {
        console.log(saltError);
        return next(saltError);
      } else {
        bcrypt.hash(
          user._update.$set.password,
          salt,
          function (hashError, hash) {
            if (hashError) {
              console.log(hashError);
              return next(hashError);
            }

            user._update.$set.password = hash;
            next();
          }
        );
      }
    });
  } else {
    return next();
  }
});

UserSchema.methods.comparePassword = function(password, callback) {
  // Versión mejorada que soporta tanto callbacks como Promesas
  
  // Validación básica
  if (typeof password !== 'string' || password.length === 0) {
    const error = new Error('Invalid password format');
    if (callback) return callback(error);
    return Promise.reject(error);
  }

  // Si no hay hash almacenado (usuario creado sin contraseña)
  if (!this.password) {
    const error = new Error('No password set for this user');
    if (callback) return callback(error);
    return Promise.reject(error);
  }

  // Implementación dual (callback y Promise)
  if (callback) {
    // Versión con callback
    bcrypt.compare(password, this.password, (error, isMatch) => {
      if (error) {
        console.error(`Password comparison failed for user ${this.username}`, error);
        return callback(error);
      }
      callback(null, isMatch);
    });
  } else {
    // Versión con Promise (para async/await)
    return new Promise((resolve, reject) => {
      bcrypt.compare(password, this.password, (error, isMatch) => {
        if (error) {
          console.error(`Password comparison failed for user ${this.username}`, error);
          reject(error);
        } else {
          resolve(isMatch);
        }
      });
    });
  }
};

module.exports = mongoose.model("User", UserSchema);
