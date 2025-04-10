const Transaction = require("../models/Transaction");
const Customer = require("../models/customer");
const Product = require("../models/product");
const { ErrorResponse } = require("../utils/errorHandler");
const asyncHandler = require("../middleware/async");

// @desc    Get all transactions
// @route   GET /api/v1/transactions
// @access  Private
exports.getTransactions = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get single transaction
// @route   GET /api/v1/transactions/:id
// @access  Private
exports.getTransaction = asyncHandler(async (req, res, next) => {
  const transaction = await Transaction.findById(req.params.id)
    .populate("customer", "name phone")
    .populate("products.product", "name price")
    .populate("processedBy", "name email");

  if (!transaction) {
    return next(
      new ErrorResponse(
        `Transaction not found with id of ${req.params.id}`,
        404
      )
    );
  }

  res.status(200).json({ success: true, data: transaction });
});

// @desc    Create new transaction
// @route   POST /api/v1/transactions
// @access  Private
exports.createTransaction = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.processedBy = req.user.id;

  // Validate customer exists
  const customer = await Customer.findById(req.body.customer);
  if (!customer) {
    return next(
      new ErrorResponse(
        `Customer not found with id of ${req.body.customer}`,
        404
      )
    );
  }

  // Validate products
  if (!req.body.products || req.body.products.length === 0) {
    return next(new ErrorResponse("Please add at least one product", 400));
  }

  // Calculate total amount and validate product quantities
  let totalAmount = 0;
  const productUpdates = [];

  for (const item of req.body.products) {
    const product = await Product.findById(item.product);

    if (!product) {
      return next(
        new ErrorResponse(`Product not found with id of ${item.product}`, 404)
      );
    }

    if (product.quantity < item.quantity) {
      return next(
        new ErrorResponse(
          `Not enough quantity available for product ${product.name}`,
          400
        )
      );
    }

    // Update product quantity
    product.quantity -= item.quantity;
    productUpdates.push(product.save());

    // Add to total amount
    totalAmount += product.price * item.quantity;

    // Store price at time of transaction
    item.priceAtTime = product.price;
  }

  // Update transaction amount
  req.body.amount = totalAmount;

  // Create transaction
  const transaction = await Transaction.create(req.body);

  // Update customer balance if it's a purchase (not payment)
  if (req.body.type === "purchase") {
    customer.balance += totalAmount;
    await customer.save();
  } else if (req.body.type === "payment") {
    customer.balance -= totalAmount;
    if (customer.balance < 0) customer.balance = 0;
    await customer.save();
  }

  // Update product quantities
  await Promise.all(productUpdates);

  res.status(201).json({ success: true, data: transaction });
});

// @desc    Get transactions by customer
// @route   GET /api/v1/transactions/customer/:customerId
// @access  Private
exports.getTransactionsByCustomer = asyncHandler(async (req, res, next) => {
  // Validate customer exists
  const customer = await Customer.findById(req.params.customerId);
  if (!customer) {
    return next(
      new ErrorResponse(
        `Customer not found with id of ${req.params.customerId}`,
        404
      )
    );
  }

  const transactions = await Transaction.find({
    customer: req.params.customerId,
  })
    .populate("products.product", "name price")
    .populate("processedBy", "name email")
    .sort("-createdAt");

  res.status(200).json({
    success: true,
    count: transactions.length,
    customer: {
      name: customer.name,
      phone: customer.phone,
      balance: customer.balance,
    },
    data: transactions,
  });
});
