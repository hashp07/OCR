import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { z } from 'zod';
import { OCRDocument } from './models/OCRDocument.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const mongoUri = process.env.MONGO_URI || process.env.MONGO_URL;

if (!mongoUri) {
  console.error('Missing MONGO_URI (or MONGO_URL) in environment. Set it in .env');
}

async function connectMongo() {
  if (!mongoUri) {
    throw new Error('MONGO_URI or MONGO_URL is not set');
  }
  if (mongoose.connection.readyState === 1) {
    return;
  }
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB (mongoose)');
}

connectMongo().catch((err) => {
  console.error('MongoDB connection error:', err);
});

function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded._id };
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
}

const saveBodySchema = z.object({
  fileName: z.string().min(1, 'fileName is required'),
  extractedText: z.string().optional().default(''),
  rawJson: z
    .unknown()
    .refine((val) => val !== null && typeof val === 'object', {
      message: 'rawJson must be an object or array',
    }),
});

// Save OCR result (auth required)
app.post('/api/ocr/save', authMiddleware, async (req, res) => {
  try {
    await connectMongo();

    const parsed = saveBodySchema.safeParse(req.body);
    if (!parsed.success) {
      const msg = parsed.error.flatten().fieldErrors;
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: msg,
      });
    }

    const { fileName, extractedText, rawJson } = parsed.data;

    const doc = await OCRDocument.create({
      fileName,
      extractedText: extractedText ?? '',
      rawJson,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: 'OCR result saved successfully',
      id: doc._id,
    });
  } catch (error) {
    console.error('Error saving OCR result:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save OCR result',
      error: error.message,
    });
  }
});

// Get all OCR results
app.get('/api/ocr/results', async (req, res) => {
  try {
    await connectMongo();

    const results = await OCRDocument.find({})
      .sort({ uploadedAt: -1 })
      .limit(100)
      .lean();

    res.status(200).json(results);
  } catch (error) {
    console.error('Error fetching OCR results:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch results',
      error: error.message,
    });
  }
});

// Delete OCR result
app.delete('/api/ocr/results/:id', async (req, res) => {
  try {
    await connectMongo();

    const deleted = await OCRDocument.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'OCR result deleted',
      deletedCount: 1,
    });
  } catch (error) {
    console.error('Error deleting OCR result:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete result',
      error: error.message,
    });
  }
});

app.listen(port, () => {
  console.log(`OCR API server running on port ${port}`);
});
