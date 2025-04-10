const Transaction = require("../models/Transaction");
const Customer = require("../models/customer");
const Product = require("../models/product");
const ErrorResponse = require("../utils/errorHandler");

module.exports = {
  createTransaction: async (transactionData) => {
    const customer = await Customer.findById(transactionData.customer);
    if (!customer) {
      throw new ErrorResponse(
        `Customer not found with id of ${transactionData.customer}`,
        404
      );
    }

    if (!transactionData.products || transactionData.products.length === 0) {
      throw new ErrorResponse("Please add at least one product", 400);
    }

    let totalAmount = 0;
    const productUpdates = [];

    for (const item of transactionData.products) {
      const product = await Product.findById(item.product);
      if (!product) {
        throw new ErrorResponse(
          `Product not found with id of ${item.product}`,
          404
        );
      }
      if (product.quantity < item.quantity) {
        throw new ErrorResponse(
          `Not enough quantity for product ${product.name}`,
          400
        );
      }

      product.quantity -= item.quantity;
      productUpdates.push(product.save());
      totalAmount += product.price * item.quantity;
      item.priceAtTime = product.price;
    }

    transactionData.amount = totalAmount;
    const transaction = await Transaction.create(transactionData);

    if (transactionData.type === "purchase") {
      customer.balance += totalAmount;
    } else if (transactionData.type === "payment") {
      customer.balance = Math.max(0, customer.balance - totalAmount);
    }
    await customer.save();

    await Promise.all(productUpdates);
    return transaction;
  },

  getTransactionsByCustomer: async (customerId) => {
    const customer = await Customer.findById(customerId);
    if (!customer) {
      throw new ErrorResponse(
        `Customer not found with id of ${customerId}`,
        404
      );
    }

    const transactions = await Transaction.find({ customer: customerId })
      .populate("products.product", "name price")
      .populate("processedBy", "name email")
      .sort("-createdAt");

    return {
      customer: {
        name: customer.name,
        phone: customer.phone,
        balance: customer.balance,
      },
      transactions,
    };
  },
};
