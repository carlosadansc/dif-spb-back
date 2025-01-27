const mongoose = require('mongoose')

const ContributionItemSchema = new mongoose.Schema({
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'ContributionItemCategory',  autopopulate: true },
    description: { type: String, required: true },
    approxPrice: {type: Number, required: true },

    active: { type: Boolean, required: true, default: true },
    deleted: { type: Boolean, required: true, default: false },
    createdBy: { type: String, required: true },
    updatedBy: { type: String, required: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
})

ContributionItemSchema.plugin(require('mongoose-autopopulate'))
module.exports = mongoose.model('ContributionItem', ContributionItemSchema);