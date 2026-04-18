const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const app = express();
const cors = require('cors');
const connectDB = require('./db/db');
const userRoutes = require('./routes/user.route');
const ocrRoutes = require('./routes/ocr.route');
connectDB();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send('Hello World!');
});
app.use('/api/ocr', ocrRoutes);
app.use('/api/users', userRoutes);

module.exports = app;
