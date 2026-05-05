// models/OCRDocument.js
const mongoose = require("mongoose");

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
      // ✅ FIX: This tells Mongoose to accept ANY keys the AI generates, 
      // preventing it from deleting your dynamic amounts!
      data: { type: mongoose.Schema.Types.Mixed, default: {} }
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