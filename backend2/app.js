const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const app = express();
const cors = require('cors');
const connectDB = require('./db/db');
const userRoutes = require('./routes/user.route');
const ocrRoutes = require('./routes/ocr.route');
connectDB();

// ✅ FIX: Configure CORS to accept requests from your local frontend AND your live Vercel frontend
const corsOptions = {
  origin: [
    'http://localhost:5173', // Allow your local Vite dev server
    'https://ocriq.vercel.app', // REPLACE THIS with your actual live Vercel frontend URL!
  ],
  methods: 'GET,POST,PUT,DELETE',
  credentials: true, // Important if you are passing cookies or authorization headers
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.use('/api/ocr', ocrRoutes);
app.use('/api/users', userRoutes);

module.exports = app;