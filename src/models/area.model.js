const mongoose = require("mongoose");

const AreaSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minLength: 4,
    },
    parentArea: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Area",
      trim: true,
      default: null,
      required: false,
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
