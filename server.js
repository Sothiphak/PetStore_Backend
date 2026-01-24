require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path'); // Required for file paths

// Initialize App
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database
connectDB();

// 🟢 ROUTES (Connecting to the 'routes' folder)
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/promotions', require('./routes/promotionRoutes')); // Fixes 404

// 🟢 STATIC FOLDER (Allows frontend to see uploaded images)
// Since server.js is in the root, 'uploads' is just 'uploads'
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health Check
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});