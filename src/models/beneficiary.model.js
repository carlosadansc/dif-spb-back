const mongoose = require('mongoose')

const BeneficiarySchema = new mongoose.Schema({
  //General
  name: { type: String, required: true },
  fatherSurname: { type: String, required: true },
  motherSurname: { type: String, required: false },
  birthdate: { type: Date, required: true },
  sex: {type: String, required: true}, //H/M
  curp: { type: String, required: true, unique: true },
  phone: { type: String, required: true, unique: true }, 
  hasDisability: {type:  String, required: true},
  disabilityType: {type: String, required: true},
  medicalService: {type: String, required: false}, 
  //Address
  communityType: {type: String, required: true}, //rural/urban
  delegation: { type: String, required: true }, //catalogo (_id) solo para rural
  community: { type: String, required: true }, //catalogo (_id) solo para rural
  street: { type: String, required: true },
  extNum: { type: String, required: true },
  intNum: { type: String, required: false }, 
  neighborhood: { type: String, required: true }, //catalogo (_id) solo para rural
  city: { type: String, required: true }, //catalogo (_id) solo para rural
  township: { type: String, required: true }, //catalogo (_id) solo para rural
  cp: { type: Number, required: true },
  //Others
  dateRegister: { type: Date, required: true },
  active: { type: Boolean, required: true, default: true },
  deleted: { type: Boolean, required: true, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model('Beneficiary', BeneficiarySchema)