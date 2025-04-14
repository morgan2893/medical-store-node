const mongoose = require("mongoose");

const StockSchema = new mongoose.Schema({
  batchNo: {
    type: String,
    required: true,
    trim: true,
  },
  expiryDate: {
    type: String,
    required: true,
    trim: true,
  },
  distributor: {
    type: String,
    required: true,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
    trim: true,
  },
  quantity: {
    type: Number,
    required: true,
    trim: true,
  },
  pricePerUnit: {
    type: "string",
    trim: true,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Stock", StockSchema);
