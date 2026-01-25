const express = require('express');
const router = express.Router();
const multer = require('multer');
const { storage } = require('../config/cloudinary'); // ✅ Import Cloudinary storage
const { 
  getProducts, 
  getProductById, 
  createProduct, 
  updateProduct,
  deleteProduct,
  createProductReview 
} = require('../controllers/productController');
const { protect, admin } = require('../middleware/authMiddleware');

// ✅ Use Cloudinary storage instead of local disk storage
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: function (req, file, cb) {
    const filetypes = /jpg|jpeg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed (jpg, jpeg, png, webp)'));
  }
});

// Routes
router.get('/', getProducts);
router.get('/:id', getProductById);

// ✅ Protected Routes with Cloudinary Upload
router.post('/', protect, admin, upload.single('image'), createProduct);
router.put('/:id', protect, admin, upload.single('image'), updateProduct);
router.delete('/:id', protect, admin, deleteProduct);

router.post('/:id/reviews', protect, createProductReview);

module.exports = router;