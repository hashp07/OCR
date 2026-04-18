const OCRModel = require('../models/OCRDocument');

module.exports.saveOCR = async (req, res) => {
  try {
    const { fileName, extractedText, rawJson } = req.body;

    if (!fileName || !extractedText || !rawJson) {
      return res.status(400).json({
        success: false,
        message: "All fields are required (fileName, extractedText, rawJson)",
      });
    }

    const savedData = await OCRModel.create({
      fileName,
      extractedText,
      rawJson,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "OCR saved successfully",
      data: savedData,
    });
  } catch (error) {
    console.error("Error saving OCR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to save OCR",
      error: error.message,
    });
  }
};

module.exports.getOCR = async (req, res) => {
  try {
    const ocr = await OCRModel.find({ createdBy: req.user.id });
    res.status(200).json({ success: true, data: ocr });
  } catch (error) {
    console.error("Error getting OCR:", error);
    res.status(500).json({ success: false, message: "Failed to get OCR", error: error.message });
  }
};