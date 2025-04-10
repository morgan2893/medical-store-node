const Customer = require("../models/customer");
const Product = require("../models/product");
const { ErrorResponse } = require("../utils/errorHandler");
const asyncHandler = require("../middleware/async");
const smsService = require("../services/sms.service");

// @desc    Notify customer about product availability
// @route   POST /api/v1/sms/notify-availability
// @access  Private
exports.notifyProductAvailability = asyncHandler(async (req, res, next) => {
  const { customerId, productId } = req.body;

  // Validate customer exists
  const customer = await Customer.findById(customerId);
  if (!customer) {
    return next(
      new ErrorResponse(`Customer not found with id of ${customerId}`, 404)
    );
  }

  // Validate product exists
  const product = await Product.findById(productId);
  if (!product) {
    return next(
      new ErrorResponse(`Product not found with id of ${productId}`, 404)
    );
  }

  // Send SMS
  await smsService.notifyProductAvailability(customerId, product.name);

  res.status(200).json({
    success: true,
    data: {
      message: "Notification sent successfully",
      customer: customer.name,
      product: product.name,
    },
  });
});

// @desc    Send payment reminder to customer
// @route   POST /api/v1/sms/payment-reminder
// @access  Private
exports.sendPaymentReminder = asyncHandler(async (req, res, next) => {
  const { customerId } = req.body;

  // Validate customer exists
  const customer = await Customer.findById(customerId);
  if (!customer) {
    return next(
      new ErrorResponse(`Customer not found with id of ${customerId}`, 404)
    );
  }

  if (customer.balance <= 0) {
    return next(new ErrorResponse("Customer has no pending balance", 400));
  }

  // Send SMS
  await smsService.notifyPaymentReminder(customerId, customer.balance);

  res.status(200).json({
    success: true,
    data: {
      message: "Payment reminder sent successfully",
      customer: customer.name,
      balance: customer.balance,
    },
  });
});

// @desc    Send custom SMS to customer
// @route   POST /api/v1/sms/custom
// @access  Private
exports.sendCustomSMS = asyncHandler(async (req, res, next) => {
  const { customerId, message } = req.body;

  if (!message) {
    return next(new ErrorResponse("Please provide a message", 400));
  }

  // Validate customer exists
  const customer = await Customer.findById(customerId);
  if (!customer) {
    return next(
      new ErrorResponse(`Customer not found with id of ${customerId}`, 404)
    );
  }

  // Send SMS
  await smsService.notifyCustomer(customerId, message);

  res.status(200).json({
    success: true,
    data: {
      message: "SMS sent successfully",
      customer: customer.name,
      phone: customer.phone,
    },
  });
});
