const User = require("../models/User");
const { jwtSecret, jwtExpire } = require("../config/auth");
const jwt = require("jsonwebtoken");
const ErrorResponse = require("../utils/errorHandler");

module.exports = {
  generateToken: (userId) => {
    return jwt.sign({ id: userId }, jwtSecret, {
      expiresIn: jwtExpire,
    });
  },

  registerUser: async (userData) => {
    if (await User.findOne({ email: userData.email })) {
      throw new ErrorResponse("User already exists", 400);
    }
    return await User.create(userData);
  },

  loginUser: async (email, password) => {
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      throw new ErrorResponse("Invalid credentials", 401);
    }
    return user;
  },
};
