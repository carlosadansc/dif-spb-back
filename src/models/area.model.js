const mongoose = require("mongoose");

const AreaSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minLength: 4,
      maxLength: 20, // Añadir límite máximo
      match: [/^[a-zA-Z0-9]+$/, "Solo caracteres alfanuméricos y espacios"], // Restringir caracteres
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
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("Area", AreaSchema);
