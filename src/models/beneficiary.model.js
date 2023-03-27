const mongoose = require('mongoose')

const BeneficiarySchema = new mongoose.Schema({
  //General
  name: { type: String, required: false },
  fatherSurname: { type: String, required: false },
  motherSurname: { type: String, required: false },
  age: { type: Number, required: false },
  birthdate: { type: Date, required: false },
  birthplace: { type: String, required: false },
  sex: { type: String, required: false }, //HOMBRE, MUJER
  curp: { type: String, required: false, unique: true },
  phone: { type: String, required: false, unique: true },
  hasDisability: { type: Boolean, required: false, default: false },
  disabilityType: { type: String, required: false },  //catalogo: MOTRIZ, ETC
  medicalService: { type: String, required: false }, //catalogo: ISSSTE, IMSS, INSABI, NINGUNO
  civilStatus: { type: String, required: false }, //CASADO, SOLTERO, VIUDO, UNION_LIBRE
  scholarship: { type: String, required: false }, // BASICA, MEDIA, MEDIA SUPERIOR, LICENCIATURA, POSGRADO
  income: { type: Number, required: false },

  //Address
  address: {
    communityType: { type: String, required: false }, // RURAL, URBANA (2 opciones)
    delegation: { type: String, required: false }, //catalogo 
    subdelegation: { type: String, required: false }, //catalogo 
    street: { type: String, required: false },
    sideStreets: { type: String, required: false },
    extNum: { type: String, required: false },
    intNum: { type: String, required: false },
    neighborhood: { type: String, required: false }, //catalogo 
    cp: { type: Number, required: false },
    city: { type: String, required: false },
  },

  //socioeconomic status
  // Tutor or spouse data
  spouseOrTutor: {
    fullname: { type: String, required: false },
    age: { type: Number, required: false },
    phone: { type: String, required: false },
    work: { type: String, required: false },
    income: { type: Number, required: false },
    comments: { type: String, required: false },
    relationship: { type: String, required: false } // SPOUSE OR TUTOR
  },

  home: {
    type: { type: String, required: false }, //CASA, DEPARTAMENTO
    roomNumber: { type: Number, required: false },
    belonging: { type: String, required: false }, // PROPIA, RENTA, HIPOTECADA, PRESTADA
    floorType: { type: String, required: false }, // Tipo de piso
    wallType: { type: String, required: false }, // Tipo de pared
    ceilingType: { type: String, required: false }, // Tipo de techo
    haveBathroom: { type: Boolean, required: false, default: false },
    haveToilet: { type: Boolean, required: false, default: false },
    haveDrainage: { type: Boolean, required: false, default: false },
    haveSepticTank: { type: Boolean, required: false, default: false },
    haveWaterService: { type: Boolean, required: false, default: false },
    haveElectricService: { type: Boolean, required: false, default: false },
    haveAirConditioning: { type: Boolean, required: false, default: false },
    haveTvService: { type: Boolean, required: false, default: false }
  },

  expenses: {
    transport: { type: Number, required: false, default: 0.0 },
    meal: { type: Number, required: false, default: 0.0 },
    tvService: { type: Number, required: false, default: 0.0 },
    waterService: { type: Number, required: false, default: 0.0 },
    electricService: { type: Number, required: false, default: 0.0 },
    otherExpenses: { type: Number, required: false, default: 0.0 }
  },

  families: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Family', autopopulate: true }],
  contributions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Contribution', autopopulate: true }],

  //Others
  active: { type: Boolean, required: false, default: true },
  deleted: { type: Boolean, required: false, default: false },
  createdBy: { type: String, required: false },
  updatedBy: { type: String, required: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

BeneficiarySchema.plugin(require('mongoose-autopopulate'))

module.exports = mongoose.model('Beneficiary', BeneficiarySchema)