const Product = require('../models/Product');
const { cloudinary } = require('../config/cloudinary');

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find({});
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create a new product
// @route   POST /api/products
// @access  Private/Admin
exports.createProduct = async (req, res) => {
  try {
    const { name, price, description, category, stockQuantity } = req.body;
    
    // ✅ CLOUDINARY: Get the uploaded image URL
    let imageUrl = 'https://via.placeholder.com/150'; // Default fallback
    
    if (req.file) {
      // Cloudinary automatically uploads and gives us the URL
      imageUrl = req.file.path; // This is the Cloudinary URL
      console.log('✅ Image uploaded to Cloudinary:', imageUrl);
    } else if (req.body.imageUrl) {
      // If a text URL was provided
      imageUrl = req.body.imageUrl;
    }

    const product = new Product({
      name,
      price,
      description,
      imageUrl: imageUrl,
      category,
      stockQuantity: stockQuantity || 0,
      user: req.user._id,
      numReviews: 0,
      rating: 0
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    console.error("Create Product Error:", error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
exports.updateProduct = async (req, res) => {
  try {
    const { name, price, description, category, stockQuantity } = req.body;
    const product = await Product.findById(req.params.id);

    if (product) {
      product.name = name || product.name;
      product.price = price || product.price;
      product.description = description || product.description;
      product.category = category || product.category;
      product.stockQuantity = stockQuantity || product.stockQuantity;

      // ✅ Update Image and delete old one from Cloudinary
      if (req.file) {
        // Delete old image from Cloudinary if it exists
        if (product.imageUrl && product.imageUrl.includes('cloudinary.com')) {
          try {
            // Extract public_id from Cloudinary URL
            const urlParts = product.imageUrl.split('/');
            const publicIdWithExtension = urlParts[urlParts.length - 1];
            const publicId = `petstore-products/${publicIdWithExtension.split('.')[0]}`;
            await cloudinary.uploader.destroy(publicId);
            console.log('🗑️ Old image deleted from Cloudinary');
          } catch (deleteError) {
            console.error('Failed to delete old image:', deleteError.message);
          }
        }
        
        // Set new image URL
        product.imageUrl = req.file.path;
        console.log('✅ Image updated on Cloudinary:', req.file.path);
      } else if (req.body.imageUrl) {
        product.imageUrl = req.body.imageUrl;
      }

      const updatedProduct = await product.save();
      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      // ✅ Delete image from Cloudinary before deleting product
      if (product.imageUrl && product.imageUrl.includes('cloudinary.com')) {
        try {
          const urlParts = product.imageUrl.split('/');
          const publicIdWithExtension = urlParts[urlParts.length - 1];
          const publicId = `petstore-products/${publicIdWithExtension.split('.')[0]}`;
          await cloudinary.uploader.destroy(publicId);
          console.log('🗑️ Image deleted from Cloudinary');
        } catch (deleteError) {
          console.error('Failed to delete image:', deleteError.message);
        }
      }

      await product.deleteOne(); 
      res.json({ message: 'Product removed' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create new review
// @route   POST /api/products/:id/reviews
// @access  Private
exports.createProductReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);

    if (product) {
      const alreadyReviewed = product.reviews.find(
        (r) => r.user.toString() === req.user._id.toString()
      );

      if (alreadyReviewed) {
        return res.status(400).json({ message: 'Product already reviewed' });
      }

      const review = {
        name: req.user.firstName,
        rating: Number(rating),
        comment,
        user: req.user._id,
      };

      product.reviews.push(review);

      product.numReviews = product.reviews.length;
      product.rating =
        product.reviews.reduce((acc, item) => item.rating + acc, 0) /
        product.reviews.length;

      await product.save();
      res.status(201).json({ message: 'Review added' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get top rated products
// @route   GET /api/products/top
// @access  Public
exports.getTopProducts = async (req, res) => {
  try {
    const products = await Product.find({}).sort({ salesCount: -1 }).limit(4);
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};