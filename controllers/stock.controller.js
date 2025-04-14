const Stock = require("../models/Stock");
const { ErrorResponse } = require("../utils/errorHandler");
const asyncHandler = require("../middleware/async");

// @desc    Get all stocks
// @route   GET /api/v1/stocks
// @access  Private
exports.getStocks = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get single stock
// @route   GET /api/v1/stocks/:id
// @access  Private
exports.getStock = asyncHandler(async (req, res, next) => {
  const stock = await Stock.findById(req.params.id).populate(
    "addedBy",
    "name email"
  );

  if (!stock) {
    return next(
      new ErrorResponse(`stock not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({ success: true, data: stock });
});

// @desc    Create new stock
// @route   POST /api/v1/stocks
// @access  Private (Admin, Manager)
exports.createStock = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.addedBy = req.user.id;

  if (req.body.products && req.body.products._id) {
    req.body.product = req.body.products._id;
  }
  delete req.body.products;

  const stock = await Stock.create(req.body);

  res.status(201).json({ success: true, data: stock });
});

// @desc    Update stock
// @route   PUT /api/v1/stocks/:id
// @access  Private (Admin, Manager)
exports.updateStock = asyncHandler(async (req, res, next) => {
  let stock = await Stock.findById(req.params.id);

  if (!stock) {
    return next(
      new ErrorResponse(`Stock not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is stock owner or admin
  if (stock.addedBy.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this stock`,
        401
      )
    );
  }

  stock = await Stock.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ success: true, data: stock });
});

// @desc    Delete stock
// @route   DELETE /api/v1/stocks/:id
// @access  Private (Admin, Manager)
exports.deleteStock = asyncHandler(async (req, res, next) => {
  const stock = await Stock.findById(req.params.id);

  if (!stock) {
    return next(
      new ErrorResponse(`Stock not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is stock owner or admin
  if (stock.addedBy.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to delete this stock`,
        401
      )
    );
  }

  await stock.remove();

  res.status(200).json({ success: true, data: {} });
});
