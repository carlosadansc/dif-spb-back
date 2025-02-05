const mongoose = require("mongoose");

const ContributionSchema = new mongoose.Schema({
  contributionItems: [{ 
    contributionItem : {type: mongoose.Schema.Types.ObjectId, ref: "ContributionItem", autopopulate: true}, 
    quantity: {type: Number, required: true},
  }],
  beneficiary: { type: mongoose.Schema.Types.ObjectId, ref: "Beneficiary" },
  comments: { type: String, required: false },
  contributionDate: { type: Date, required: true, default: Date.now },
  receiver: { type: String, required: false },

  active: { type: Boolean, required: true, default: true },
  deleted: { type: Boolean, required: true, default: false },
  createdBy: { type: String, required: true },
  updatedBy: { type: String, required: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

ContributionSchema.plugin(require("mongoose-autopopulate"));

module.exports = mongoose.model("Contribution", ContributionSchema);
