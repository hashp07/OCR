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

module.exports.updateOCR = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, extractedText } = req.body || {};

    if (!id) {
      return res.status(400).json({ success: false, message: "Document id is required" });
    }

    if (!data || typeof data !== "object") {
      return res.status(400).json({ success: false, message: "Body must include a JSON object: { data: {...} }" });
    }

    const nextExtractedText =
      typeof extractedText === "string" && extractedText.trim()
        ? extractedText
        : (() => {
            try {
              return JSON.stringify({ data });
            } catch {
              return "";
            }
          })();

    const updated = await OCRModel.findOneAndUpdate(
      { _id: id, createdBy: req.user.id },
      {
        $set: {
          "rawJson.data": data,
          extractedText: nextExtractedText,
        },
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating OCR:", error);
    return res.status(500).json({ success: false, message: "Failed to update OCR", error: error.message });
  }
};

module.exports.deleteOCR = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, message: "Document id is required" });

    const deleted = await OCRModel.findOneAndDelete({ _id: id, createdBy: req.user.id });
    if (!deleted) return res.status(404).json({ success: false, message: "Document not found" });

    return res.status(200).json({ success: true, message: "Document deleted" });
  } catch (error) {
    console.error("Error deleting OCR:", error);
    return res.status(500).json({ success: false, message: "Failed to delete OCR", error: error.message });
  }
};