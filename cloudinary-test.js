// test-cloudinary.js
// Run this file to test Cloudinary connection
require('dotenv').config();
const { cloudinary } = require('./config/cloudinary');

console.log('Testing Cloudinary connection...');

cloudinary.api.ping()
  .then(result => {
    console.log('✅ Cloudinary connected successfully!');
    console.log('Cloud Name:', cloudinary.config().cloud_name);
    console.log('Response:', result);
  })
  .catch(error => {
    console.error('❌ Cloudinary connection failed:');
    console.error(error.message);
    console.log('\nCheck your .env file has:');
    console.log('CLOUDINARY_URL=cloudinary://759821486927359:JfdS9o0CoBIIrvciitXwYHKrTEQ@dul6fgqk5');
  });