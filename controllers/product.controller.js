const Product = require("../models/Product");
const { ErrorResponse } = require("../utils/errorHandler");
const asyncHandler = require("../middleware/async");

// @desc    Get all products
// @route   GET /api/v1/products
// @access  Private
exports.getProducts = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

exports.getAll = asyncHandler(async (req, res) => {
  const products = await Product.find({}, { _id: 1, name: 1 });
  res.status(200).json({ success: true, data: products });
});

// @desc    Get single product
// @route   GET /api/v1/products/:id
// @access  Private
exports.getProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id).populate(
    "addedBy",
    "name email"
  );

  if (!product) {
    return next(
      new ErrorResponse(`Product not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({ success: true, data: product });
});

// @desc    Create new product
// @route   POST /api/v1/products
// @access  Private (Admin, Manager)
exports.createProduct = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.addedBy = req.user.id;

  const product = await Product.create(req.body);

  res.status(201).json({ success: true, data: product });
});

// @desc    Update product
// @route   PUT /api/v1/products/:id
// @access  Private (Admin, Manager)
exports.updateProduct = asyncHandler(async (req, res, next) => {
  let product = await Product.findById(req.params.id);

  if (!product) {
    return next(
      new ErrorResponse(`Product not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is product owner or admin
  if (product.addedBy.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this product`,
        401
      )
    );
  }

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ success: true, data: product });
});

// @desc    Delete product
// @route   DELETE /api/v1/products/:id
// @access  Private (Admin, Manager)
exports.deleteProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(
      new ErrorResponse(`Product not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is product owner or admin
  if (product.addedBy.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to delete this product`,
        401
      )
    );
  }

  await product.remove();

  res.status(200).json({ success: true, data: {} });
});
