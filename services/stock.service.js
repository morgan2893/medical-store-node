const Stock = require("../models/Stock");
const ErrorResponse = require("../utils/errorHandler");

module.exports = {
  getAllStocks: async (query) => {
    return await Stock.find(query).populate("addedBy", "name email");
  },

  getStockById: async (id) => {
    const stock = await Stock.findById(id).populate("addedBy", "name email");
    if (!stock)
      throw new ErrorResponse(`Stock not found with id of ${id}`, 404);
    return stock;
  },

  createStock: async (stockData) => {
    return await Stock.create(stockData);
  },

  updateStock: async (id, updateData, userId, userRole) => {
    const stock = await Stock.findById(id);
    if (!stock)
      throw new ErrorResponse(`Stock not found with id of ${id}`, 404);

    if (stock.addedBy.toString() !== userId && userRole !== "admin") {
      throw new ErrorResponse(`Not authorized to update this stock`, 401);
    }

    return await Stock.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
  },

  deleteStock: async (id, userId, userRole) => {
    const stock = await Stock.findById(id);
    if (!stock)
      throw new ErrorResponse(`Stock not found with id of ${id}`, 404);

    if (stock.addedBy.toString() !== userId && userRole !== "admin") {
      throw new ErrorResponse(`Not authorized to delete this stock`, 401);
    }

    await stock.remove();
  },
};
