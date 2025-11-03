const mongoose = require("mongoose");

const ContributionSchema = new mongoose.Schema(
  {
    folio: { type: String, unique: true },
    productOrServices: [
      {
        productOrService: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "ProductOrService",
          autopopulate: true,
        },
        description: {
          type: String,
          required: false,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
      },
    ],
    beneficiary: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Beneficiary",
    },
    evidencePhoto:{
      type: String,
      required: false,
    },
    comments: {
      type: String,
      required: false,
      trim: true,
    },
    contributionDate: {
      type: Date,
      default: Date.now,
      validate: {
        validator: (v) => v <= new Date(),
        message: "La fecha no puede ser futura",
      },
    },
    receiver: {
      type: String,
      required: false,
      trim: true,
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
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      autopopulate: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      autopopulate: true,
    },
  },
  {
    timestamps: true, // Reemplaza createdAt/updatedAt manuales
    versionKey: false, // Opcional
  }
);

// Pre-hook para generar el folio
ContributionSchema.pre("save", async function (next) {
  if (!this.isNew) return next();

  try {
    const user = await mongoose.model("User").findById(this.createdBy).populate("area");
    if (!user || !user.area || !user.area.name) {
      return next(new Error("Usuario sin área asignada"));
    }

    const areaPrefix = user.area.name.substring(0, 3).toUpperCase();
    const year = new Date().getFullYear();

    // Contar TODAS las contribuciones del área en el año actual (incluyendo borradas)
    // Esto garantiza que los folios nunca se repitan
    const count = await mongoose.model("Contribution").countDocuments({
      folio: new RegExp(`^${areaPrefix}-${year}-`),
      // NO filtrar por deleted, contar todos los registros
    });

    this.folio = `${areaPrefix}-${year}-${String(count + 1).padStart(6, "0")}`;
    next();
  } catch (error) {
    next(error);
  }
});
// Índices
ContributionSchema.index({ beneficiary: 1 });
ContributionSchema.index({ contributionDate: -1 });

// Plugin para autopopulate (si lo usas)
ContributionSchema.plugin(require("mongoose-autopopulate"));

module.exports = mongoose.model("Contribution", ContributionSchema);
