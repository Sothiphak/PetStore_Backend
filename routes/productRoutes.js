const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { 
  getProducts, 
  getProductById, 
  createProduct, 
  updateProduct,
  deleteProduct,
  createProductReview 
} = require('../controllers/productController');
const { protect, admin } = require('../middleware/authMiddleware');

// 🟢 IMAGE UPLOAD CONFIGURATION
const storage = multer.diskStorage({
  destination(req, file, cb) {
    // 👇 KEY FIX: Go up one level (..) from 'routes' to find 'uploads' in root
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

// Protected Routes
router.post('/', protect, admin, upload.single('image'), createProduct);
router.put('/:id', protect, admin, upload.single('image'), updateProduct);
router.delete('/:id', protect, admin, deleteProduct);

router.post('/:id/reviews', protect, createProductReview);

module.exports = router;