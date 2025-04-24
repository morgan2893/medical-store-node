const Customer = require("../models/Customer");
const { ErrorResponse } = require("../utils/errorHandler");
const asyncHandler = require("../middleware/async");

// @desc    Get all customers
// @route   GET /api/v1/customers
// @access  Private
exports.getCustomers = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

exports.getAll = asyncHandler(async (req, res, next) => {
  const customers = await Customer.find({}, { _id: 1, name: 1 });
  res.status(200).json({ success: true, data: customers });
});

// @desc    Get single customer
// @route   GET /api/v1/customers/:id
// @access  Private
exports.getCustomer = asyncHandler(async (req, res, next) => {
  const customer = await Customer.findById(req.params.id).populate(
    "createdBy",
    "name email"
  );

  if (!customer) {
    return next(
      new ErrorResponse(`Customer not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({ success: true, data: customer });
});

// @desc    Create new customer
// @route   POST /api/v1/customers
// @access  Private
exports.createCustomer = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.createdBy = req.user.id;

  // Check if phone number already exists
  const existingCustomer = await Customer.findOne({ phone: req.body.phone });
  if (existingCustomer) {
    return next(
      new ErrorResponse("Customer with this phone number already exists", 400)
    );
  }

  const customer = await Customer.create(req.body);

  res.status(201).json({ success: true, data: customer });
});

// @desc    Update customer
// @route   PUT /api/v1/customers/:id
// @access  Private
exports.updateCustomer = asyncHandler(async (req, res, next) => {
  let customer = await Customer.findById(req.params.id);

  if (!customer) {
    return next(
      new ErrorResponse(`Customer not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is customer owner or admin
  if (
    customer.createdBy.toString() !== req.user.id &&
    req.user.role !== "admin"
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this customer`,
        401
      )
    );
  }

  customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ success: true, data: customer });
});

// @desc    Delete customer
// @route   DELETE /api/v1/customers/:id
// @access  Private (Admin, Manager)
exports.deleteCustomer = asyncHandler(async (req, res, next) => {
  const customer = await Customer.findById(req.params.id);

  if (!customer) {
    return next(
      new ErrorResponse(`Customer not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is customer owner or admin/manager
  if (
    customer.createdBy.toString() !== req.user.id &&
    !["admin", "manager"].includes(req.user.role)
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to delete this customer`,
        401
      )
    );
  }

  await customer.remove();

  res.status(200).json({ success: true, data: {} });
});

// @desc    Get customer balance
// @route   GET /api/v1/customers/:id/balance
// @access  Private
exports.getCustomerBalance = asyncHandler(async (req, res, next) => {
  const customer = await Customer.findById(req.params.id);

  if (!customer) {
    return next(
      new ErrorResponse(`Customer not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: {
      balance: customer.balance,
      customer: customer.name,
      phone: customer.phone,
    },
  });
});

// @desc    Update customer balance
// @route   PUT /api/v1/customers/:id/balance
// @access  Private
exports.updateCustomerBalance = asyncHandler(async (req, res, next) => {
  const customer = await Customer.findById(req.params.id);

  if (!customer) {
    return next(
      new ErrorResponse(`Customer not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is authorized
  if (
    customer.createdBy.toString() !== req.user.id &&
    req.user.role !== "admin"
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this customer's balance`,
        401
      )
    );
  }

  const { amount, type } = req.body;

  if (!amount || !type) {
    return next(
      new ErrorResponse("Please provide amount and type (credit/debit)", 400)
    );
  }

  if (type === "credit") {
    customer.balance += amount;
  } else if (type === "debit") {
    customer.balance -= amount;
  } else {
    return next(new ErrorResponse("Type must be either credit or debit", 400));
  }

  await customer.save();

  res.status(200).json({
    success: true,
    data: {
      newBalance: customer.balance,
      customer: customer.name,
      phone: customer.phone,
    },
  });
});
