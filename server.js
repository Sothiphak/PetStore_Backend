require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path');
const fs = require('fs'); // 👈 REQUIRED: Import File System

// Initialize App
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database
connectDB();

// 🟢 AUTO-CREATE UPLOADS FOLDER (The Fix)
// This checks if 'uploads' exists. If not, it creates it.
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir);
    console.log('📂 Created uploads folder automatically');
}

// 🟢 ROUTES
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/promotions', require('./routes/promotionRoutes'));

// 🟢 STATIC IMAGES
app.use('/uploads', express.static(uploadsDir));

// Health Check
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});