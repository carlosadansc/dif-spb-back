const mongoose = require('mongoose')

const ContributionItemCategorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    label: { type: String, required: true },
    decription: { type: String, required: false },
    color: { type: String, required: true },
    active: { type: Boolean, required: true, default: true },
    deleted: { type: Boolean, required: true, default: false },
    createdBy: { type: String, required: true },
    updatedBy: { type: String, required: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model('ContributionItemCategory', ContributionItemCategorySchema);