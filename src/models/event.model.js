const mongoose = require('mongoose')

const EventSchema = mongoose.Schema({
    type: { type: String, require: true }, //LLAMADA, VISITA DOMICILIARIA, VISITA CENTRAL
    subject: { type: String, require: true }, // ASUNTO
    canalization: { type: String, require: true }, // CATALOGO DE STRINGS: PROCURADURIA, DIF ESTATAL, SISTEMA PENAL
    comments: { type: String, require: true },

    active: { type: Boolean, required: true, default: true },
    deleted: { type: Boolean, required: true, default: false },
    createdBy: { type: String, required: true },
    updatedBy: { type: String, required: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model('Event', EventSchema);
