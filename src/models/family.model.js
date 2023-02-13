const mongoose = require('mongoose')

const FamilySchema = new mongoose.Schema({
    name: { type: String, required: true },
    lastname: { type: String, required: true },
    age: { type: Number, required: false },
    phone: { type: String, required: true },
    relationship: { type: String, required: true }, // ESPOSO, HERMANO, MAMA, PAPA, ETC

    active: { type: Boolean, required: true, default: true },
    deleted: { type: Boolean, required: true, default: false },
    createdBy: { type: String, required: true },
    updatedBy: { type: String, required: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model('Family', FamilySchema);