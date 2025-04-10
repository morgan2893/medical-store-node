const twilio = require("twilio");
const Customer = require("../models/customer");
const ErrorResponse = require("../utils/errorHandler");
const { accountSid, authToken, phoneNumber } = require("../config/sms");

const client = twilio(accountSid, authToken);

exports.sendSMS = async (phone, message) => {
  try {
    await client.messages.create({
      body: message,
      from: phoneNumber,
      to: phone,
    });
    return { success: true };
  } catch (err) {
    console.error("Twilio error:", err);
    throw new ErrorResponse("Failed to send SMS", 500);
  }
};

exports.notifyCustomer = async (customerId, message) => {
  try {
    const customer = await Customer.findById(customerId);
    if (!customer) {
      throw new ErrorResponse("Customer not found", 404);
    }
    return await this.sendSMS(customer.phone, message);
  } catch (err) {
    throw err;
  }
};

exports.notifyProductAvailability = async (customerId, productName) => {
  const message = `Dear ${
    customerId.name
  }, your requested medicine ${productName} is now available at our store. - ${
    process.env.STORE_NAME || "Medical Store"
  }`;
  return await this.notifyCustomer(customerId, message);
};

exports.notifyPaymentReminder = async (customerId, amount) => {
  const message = `Dear ${
    customerId.name
  }, your pending payment is Rs. ${amount}. Please visit our store to clear your dues. - ${
    process.env.STORE_NAME || "Medical Store"
  }`;
  return await this.notifyCustomer(customerId, message);
};
