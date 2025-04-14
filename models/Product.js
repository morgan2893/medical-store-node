const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },

  category: {
    type: String,
    enum: [
      "tablet",
      "capsule",
      "syrup",
      "drop",
      "ointment",
      "equipment",
      "personal_care",
      "other",
    ],
    default: "medicine",
    require: true,
  },
  manufacturer: {
    type: String,
    trim: true,
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

module.exports = mongoose.model("Product", ProductSchema);
