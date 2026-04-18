const mongoose = require('mongoose');

function connectDB() {
  mongoose.connect(process.env.DB_CONNECT)
    .then(() => console.log('MongoDB connected successfully'))
    .catch((err) => {
      console.error('MongoDB connection error:', err);
      process.exit(1);
    }); 
}

module.exports = connectDB;