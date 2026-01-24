require('dotenv').config(); // Load environment variables
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path'); // 👈 Required for images

// Initialize the App
const app = express();

// --- 1. Middleware ---
app.use(cors()); 
app.use(express.json()); 

// --- 2. Database Connection ---
connectDB();

// --- 3. Routes ---
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
// 👇 THIS FIXES THE PROMOTIONS 404 ERROR
app.use('/api/promotions', require('./routes/promotionRoutes')); 

// Note: If you don't have paymentRoutes yet, keep this commented out
// app.use('/api/payment', require('./routes/paymentRoutes')); 

// --- 4. Static Images (Crucial for Product Uploads) ---
// This makes the 'uploads' folder public so the frontend can display images
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

// --- 5. Base Route (Health Check) ---
app.get('/', (req, res) => {
  res.send('API is running...');
});

// --- 6. Start Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});