const Product = require("../models/Product");
const ErrorResponse = require("../utils/errorHandler");

module.exports = {
  getAllProducts: async (query) => {
    return await Product.find(query).populate("addedBy", "name email");
  },

  getProductById: async (id) => {
    const product = await Product.findById(id).populate(
      "addedBy",
      "name email"
    );
    if (!product)
      throw new ErrorResponse(`Product not found with id of ${id}`, 404);
    return product;
  },

  createProduct: async (productData) => {
    return await Product.create(productData);
  },

  updateProduct: async (id, updateData, userId, userRole) => {
    const product = await Product.findById(id);
    if (!product)
      throw new ErrorResponse(`Product not found with id of ${id}`, 404);

    if (product.addedBy.toString() !== userId && userRole !== "admin") {
      throw new ErrorResponse(`Not authorized to update this product`, 401);
    }

    return await Product.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
  },

  deleteProduct: async (id, userId, userRole) => {
    const product = await Product.findById(id);
    if (!product)
      throw new ErrorResponse(`Product not found with id of ${id}`, 404);

    if (product.addedBy.toString() !== userId && userRole !== "admin") {
      throw new ErrorResponse(`Not authorized to delete this product`, 401);
    }

    await product.remove();
  },
};
