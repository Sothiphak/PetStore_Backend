// backend/seeder.js
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Product = require('./models/Product'); // Ensure this path is correct
const products = require('./data/products'); // Load the data

const importData = async () => {
  try {
    await connectDB();

    // 1. Clear existing products (Optional: Comment out if you want to keep old ones)
    await Product.deleteMany();
    console.log('🗑️  Old Data Destroyed...');

    // 2. Insert new products
    await Product.insertMany(products);
    console.log('🌱 Data Imported Successfully!');

    process.exit();
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
};

importData();