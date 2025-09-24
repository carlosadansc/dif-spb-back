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
  if (!this.isNew) return next(); // Solo para registros nuevos

  try {
    // Poblar el campo 'area' para obtener el documento completo
    const user = await mongoose.model("User").findById(this.createdBy).populate("area");
    if (!user) {
      return next(new Error("Usuario creador no encontrado"));
    }

    // Validar que el usuario tiene un área y que el área tiene un nombre
    if (!user.area || !user.area.name) {
      return next(new Error("El usuario no tiene un área asignada o el área no tiene nombre"));
    }

    const areaPrefix = user.area.name.substring(0, 3).toUpperCase(); // Ej: "Logística" → "LOG"
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");

    // Contar contribuciones existentes en el mes/año para el área
    const count = await mongoose.model("Contribution").countDocuments({
      folio: new RegExp(`^${areaPrefix}-${year}-${month}`),
    });

    this.folio = `${areaPrefix}-${year}-${month}-${String(count + 1).padStart(
      3,
      "0"
    )}`;
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
