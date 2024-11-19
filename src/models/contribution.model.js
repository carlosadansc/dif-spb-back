const mongoose = require("mongoose");

const ContributionSchema = new mongoose.Schema({
  contributionItem: { type: mongoose.Schema.Types.ObjectId, ref: "ContributionItem", autopopulate: true, },
  beneficiary: { type: mongoose.Schema.Types.ObjectId, ref: "Beneficiary" },
  applicant: { type: String, required: true },
  quantity: { type: Number, required: true },
  comments: { type: String, required: false },

  active: { type: Boolean, required: true, default: true },
  deleted: { type: Boolean, required: true, default: false },
  createdBy: { type: String, required: true },
  updatedBy: { type: String, required: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

ContributionSchema.plugin(require("mongoose-autopopulate"));

module.exports = mongoose.model("Contribution", ContributionSchema);
