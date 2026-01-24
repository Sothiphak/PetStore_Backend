const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path'); // 👈 We need this
const { 
  getProducts, 
  getProductById, 
  createProduct, 
  updateProduct,
  deleteProduct,
  createProductReview 
} = require('../controllers/productController');
const { protect, admin } = require('../middleware/authMiddleware');

// 🟢 IMAGE UPLOAD CONFIGURATION (THE FIX)
const storage = multer.diskStorage({
  destination(req, file, cb) {
    // 👇 THIS LINE IS CRITICAL
    // It says: "Start at this file ('routes'), go up one level ('..'), then into 'uploads'"
    cb(null, path.join(__dirname, '../uploads')); 
  },
  filename(req, file, cb) {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ 
  storage,
  fileFilter: function (req, file, cb) {
    const filetypes = /jpg|jpeg|png|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) return cb(null, true);
    cb('Images only!');
  }
});

// Routes
router.get('/', getProducts);
router.get('/:id', getProductById);

// 🟢 Protected Routes with File Upload
router.post('/', protect, admin, upload.single('image'), createProduct);
router.put('/:id', protect, admin, upload.single('image'), updateProduct);
router.delete('/:id', protect, admin, deleteProduct);

router.post('/:id/reviews', protect, createProductReview);

module.exports = router;