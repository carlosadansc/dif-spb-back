const mongoose = require("mongoose");

const SocioeconomicAssessmentSchema = new mongoose.Schema(
  {
    folio: { type: String, required: false },
    // Reference to beneficiary
    beneficiary: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Beneficiary",
      required: true,
      autopopulate: true,
    },

    // Assessment date
    assessmentDate: {
      type: Date,
      required: true,
      default: Date.now,
    },

    // Snapshot of beneficiary's socioeconomic data at this point in time
    snapshot: {
      // Personal economic data
      income: { type: Number, required: false, default: 0.0 },
      occupation: { type: String, required: false },
      occupationDescription: { type: String, required: false },
      scholarship: { type: String, required: false },
      civilStatus: { type: String, required: false },
      medicalService: { type: String, required: false },

      // Address snapshot
      address: {
        communityType: { type: String, required: false },
        delegation: { type: String, required: false },
        subdelegation: { type: String, required: false },
        street: { type: String, required: false },
        sideStreets: { type: String, required: false },
        extNum: { type: String, required: false },
        intNum: { type: String, required: false },
        neighborhood: { type: String, required: false },
        cp: { type: Number, required: false },
        city: { type: String, required: false },
      },

      // Spouse or tutor data snapshot
      spouseOrTutor: {
        curp: { type: String, required: false },
        fullname: { type: String, required: false },
        age: { type: Number, required: false },
        phone: { type: String, required: false },
        work: { type: String, required: false },
        income: { type: Number, required: false, default: 0.0 },
        relationship: { type: String, required: false },
      },

      // Home conditions snapshot
      home: {
        type: { type: String, required: false },
        roomNumber: { type: Number, required: false },
        belonging: { type: String, required: false },
        floorType: { type: String, required: false },
        wallType: { type: String, required: false },
        ceilingType: { type: String, required: false },
        haveBathroom: { type: Boolean, required: false, default: false },
        haveToilet: { type: Boolean, required: false, default: false },
        haveDrainage: { type: Boolean, required: false, default: false },
        haveSepticTank: { type: Boolean, required: false, default: false },
        haveWaterService: { type: Boolean, required: false, default: false },
        haveElectricService: { type: Boolean, required: false, default: false },
        haveAirConditioning: { type: Boolean, required: false, default: false },
        haveTvService: { type: Boolean, required: false, default: false },
      },

      // Expenses snapshot
      expenses: {
        transport: { type: Number, required: false, default: 0.0 },
        meal: { type: Number, required: false, default: 0.0 },
        tvService: { type: Number, required: false, default: 0.0 },
        waterService: { type: Number, required: false, default: 0.0 },
        electricService: { type: Number, required: false, default: 0.0 },
        otherExpenses: { type: Number, required: false, default: 0.0 },
      },

      // Family composition at this time (array of family member data)
      familyMembers: [
        {
          name: { type: String, required: false },
          lastname: { type: String, required: false },
          age: { type: Number, required: false },
          sex: { type: String, required: false },
          scholarship: { type: String, required: false },
          phone: { type: String, required: false },
          relationship: { type: String, required: false },
          occupation: { type: String, required: false },
          income: { type: Number, required: false },
        },
      ],

      // Total household income (calculated)
      totalHouseholdIncome: { type: Number, required: false, default: 0.0 },
      totalHouseholdExpenses: { type: Number, required: false, default: 0.0 },
      householdSize: { type: Number, required: false, default: 1 },
    },

    // Assessment notes and observations
    notes: { type: String, required: false },

    // Metadata
    active: { type: Boolean, required: false, default: true },
    deleted: { type: Boolean, required: false, default: false },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
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
    timestamps: true,
    versionKey: false,
  }
);

SocioeconomicAssessmentSchema.pre("save", async function (next) {
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
    const count = await mongoose.model("SocioeconomicAssessment").countDocuments({
      folio: new RegExp(`^ES${areaPrefix}-${year}-`),
      // NO filtrar por deleted, contar todos los registros
    });

    this.folio = `ES${areaPrefix}-${year}-${String(count + 1).padStart(6, "0")}`;
    next();
  } catch (error) {
    next(error);
  }
});

// Index for efficient queries
SocioeconomicAssessmentSchema.index({ beneficiary: 1, assessmentDate: -1 });

SocioeconomicAssessmentSchema.plugin(require("mongoose-autopopulate"));

module.exports = mongoose.model(
  "SocioeconomicAssessment",
  SocioeconomicAssessmentSchema
);