const mongoose = require("mongoose");

const CustomerSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    name: { type: String, default: null },
    email: { type: String, default: null },
    phone: { type: String, default: null },
    address: { type: String, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

CustomerSchema.index({ createdBy: 1, key: 1 }, { unique: true });

module.exports = mongoose.model("Customer", CustomerSchema);

