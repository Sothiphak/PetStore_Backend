require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet'); // 🛡️ Security Headers
const rateLimit = require('express-rate-limit'); // 🛡️ Brute Force Protection
const mongoSanitize = require('express-mongo-sanitize'); // 🛡️ NoSQL Injection Prevention
const connectDB = require('./config/db');

// Initialize App
const app = express();

// 1. 🛡️ Set Security Headers (First middleware)
app.use(helmet());

// 2. 🛡️ CORS Configuration (Fixed for Render Deployment)
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'https://petstore-project.onrender.com', // Previous Render URL
      'https://pet-store-project-two.vercel.app', // ✅ New Vercel Deployment
      'https://pet-store-project-two.vercel.app/', // ✅ Trailing slash variant
    ];

    // ✅ ALLOW Health Checks & Mobile Apps (Requests with no origin)
    // This fixes the "Timed Out" error on Render deployment
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    } 

    // ⚠️ TEMPORARY: Log & Allow others for testing
    // This prevents blocking your frontend while you are setting up the URL
    console.log("⚠️ Potential CORS Block (Allowed for now):", origin);
    return callback(null, true); 
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// 3. 🛡️ Rate Limiting (50000 requests per 15 minutes)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 50000,
  standardHeaders: true, 
  legacyHeaders: false,
  message: { message: 'Too many requests from this IP, please try again after 15 minutes' }
});
app.use('/api', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10kb' })); // 🛡️ Limit body size to prevent DoS
app.use(express.urlencoded({ extended: true }));

// 4. 🛡️ Data Sanitization
app.use(mongoSanitize()); // Prevent NoSQL Injection (e.g. {"$gt": ""})

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Database
connectDB();

// 🟢 HEALTH CHECK ENDPOINT (Critical for Render!)
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.send('🐾 PetStore+ API is running...');
});

// 🟢 API ROUTES
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/promotions', require('./routes/promotionRoutes'));
app.use('/api/payment', require('./routes/paymentRoutes'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.path}` });
});

// Start Server - CRITICAL: Bind to 0.0.0.0 for Render
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('☁️  Images stored on Cloudinary');
});