require('dotenv').config(); // Load environment variables
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Initialize the App
const app = express();

// --- 1. Middleware ---
// Allows your frontend (Vue.js) to talk to this backend
app.use(cors()); 
// Allows the server to accept JSON data in requests (req.body)
app.use(express.json()); 

// --- 2. Database Connection ---
connectDB();

// --- 3. Routes ---
// We import the specific route files to keep server.js clean
app.use('/api/auth', require('./routes/authRoutes'));       // Register, Login, Profile
app.use('/api/products', require('./routes/productRoutes')); // Browse products
app.use('/api/orders', require('./routes/orderRoutes'));     // Checkout, Order History
app.use('/api/payment', require('./routes/paymentRoutes'));

// --- 4. Base Route (Health Check) ---
// Useful to test if the server is alive by visiting http://localhost:5000
app.get('/', (req, res) => {
  res.send('API is running...');
});

// --- 5. Start Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});