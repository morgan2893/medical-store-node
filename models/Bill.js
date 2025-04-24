const mongoose = require("mongoose");

const BillSchema = new mongoose.Schema({
  billNo: {
    type: Number,
    require: true,
  },

  customer: {
    type: mongoose.Schema.Types.ObjectId,
    require: true,
    ref: "Customer",
  },
  products: [
    {
      medicine: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
      quantity: {
        type: Number,
        default: 1,
        require: true,
      },
      priceAtSale: {
        type: Number,
        default: 0,
      },
      discount: {
        type: Number,
        default: 0,
      },
      discountPrice: {
        type: Number,
      },
    },
  ],
  pdfDriveFileId: {
    type: String,
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

module.exports = mongoose.model("Bill", BillSchema);
