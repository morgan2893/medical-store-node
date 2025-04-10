const Customer = require("../models/Customer");
const ErrorResponse = require("../utils/errorHandler");

module.exports = {
  getAllCustomers: async (query) => {
    return await Customer.find(query).populate("createdBy", "name email");
  },

  getCustomerById: async (id) => {
    const customer = await Customer.findById(id).populate(
      "createdBy",
      "name email"
    );
    if (!customer)
      throw new ErrorResponse(`Customer not found with id of ${id}`, 404);
    return customer;
  },

  createCustomer: async (customerData) => {
    if (await Customer.findOne({ phone: customerData.phone })) {
      throw new ErrorResponse("Customer with this phone already exists", 400);
    }
    return await Customer.create(customerData);
  },

  updateCustomer: async (id, updateData, userId, userRole) => {
    const customer = await Customer.findById(id);
    if (!customer)
      throw new ErrorResponse(`Customer not found with id of ${id}`, 404);

    if (
      customer.createdBy.toString() !== userId &&
      !["admin", "manager"].includes(userRole)
    ) {
      throw new ErrorResponse(`Not authorized to update this customer`, 401);
    }

    return await Customer.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
  },

  updateCustomerBalance: async (id, amount, type, userId) => {
    const customer = await Customer.findById(id);
    if (!customer)
      throw new ErrorResponse(`Customer not found with id of ${id}`, 404);

    if (customer.createdBy.toString() !== userId) {
      throw new ErrorResponse(
        `Not authorized to update this customer's balance`,
        401
      );
    }

    if (type === "credit") {
      customer.balance += amount;
    } else if (type === "debit") {
      customer.balance -= amount;
    } else {
      throw new ErrorResponse("Type must be either credit or debit", 400);
    }

    await customer.save();
    return customer;
  },
};
