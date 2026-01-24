require('dotenv').config(); // Load environment variables
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path'); // 👈 REQUIRED for images

// Initialize the App
const app = express();

// --- 1. Middleware ---
app.use(cors()); 
app.use(express.json()); // Allows JSON data

// --- 2. Database Connection ---
connectDB();

// --- 3. Routes ---
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/promotions', require('./routes/promotionRoutes')); // 👈 NEW: Fixes the 404 Error!

// Note: Ensure you have paymentRoutes.js if you keep this line, otherwise comment it out
// app.use('/api/payment', require('./routes/paymentRoutes')); 

// --- 4. Static Images (Crucial for Product Uploads) ---
// This makes the 'uploads' folder public so the frontend can display images
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

// --- 5. Base Route (Health Check) ---
app.get('/', (req, res) => {
  res.send('API is running...');
});

// --- 6. Error Handling (Optional but recommended) ---
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

// --- 7. Start Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});