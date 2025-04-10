const { ErrorResponse } = require("./errorHandler");
const validator = require("validator");

module.exports = {
  validateEmail: (email) => {
    if (!validator.isEmail(email)) {
      throw new ErrorResponse("Invalid email format", 400);
    }
  },

  validatePassword: (password) => {
    if (password.length < 8) {
      throw new ErrorResponse("Password must be at least 8 characters", 400);
    }
  },

  validatePhone: (phone) => {
    if (!validator.isMobilePhone(phone)) {
      throw new ErrorResponse("Invalid phone number", 400);
    }
  },

  validateProductData: (productData) => {
    if (!productData.name || !productData.price || !productData.quantity) {
      throw new ErrorResponse("Please provide name, price and quantity", 400);
    }
  },
};
