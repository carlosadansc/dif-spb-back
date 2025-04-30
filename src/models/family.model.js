const mongoose = require('mongoose')

const FamilySchema = new mongoose.Schema({
    name: { type: String, required: false },
    lastname: { type: String, required: false },
    age: { type: Number, required: false },
    sex: { type: String, required: false },
    scholarship: { type: String, required: false },
    phone: { type: String, required: false },
    relationship: { type: String, required: false }, // ESPOSO, HERMANO, MAMA, PAPA, ETC
    occupation: { type: String, required: false }, //catalogo
    income: { type: Number, required: false },  //INGRESOS MENSUALES

    active: { type: Boolean, required: true, default: true },
    deleted: { type: Boolean, required: true, default: false },
    createdBy: { type: String, required: true },
    updatedBy: { type: String, required: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model('Family', FamilySchema);