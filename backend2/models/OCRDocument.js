// models/OCRDocument.js
const mongoose = require("mongoose");

const BillDataSchema = new mongoose.Schema(
  {
    bill_date: String,
    due_date: String,
    bill_number: String,
    bill_period: String,
    account_holder: String,
    consumer_number: String,
    bu: String,
    pc: String,
    disconn_tag: String,
    bill_month: String,
    dtc_code: String,
    before_nov_30_2024: String,
    between_nov_30_2024_and_jan_20_2025: String,
    after_jan_20_2025: String,
  },
  { _id: false }
);

const OCRDocumentSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      required: true,
    },

    extractedText: {
      type: String,
      required: true,
    },

    rawJson: {
      document: {
        type: String,
        default: "bill",
      },
      data: BillDataSchema,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("OCRDocument", OCRDocumentSchema);