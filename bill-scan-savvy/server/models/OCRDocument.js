import mongoose from 'mongoose';

const ocrDocumentSchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true },
    extractedText: { type: String, default: '' },
    rawJson: { type: mongoose.Schema.Types.Mixed, required: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    uploadedAt: { type: Date, default: Date.now },
  },
  { collection: 'ocr_documents' }
);

export const OCRDocument = mongoose.model('OCRDocument', ocrDocumentSchema);
