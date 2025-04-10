const User = require("../models/user");
const { ErrorResponse } = require("../utils/errorHandler");
const asyncHandler = require("../middleware/async");

// @desc    Get all users
// @route   GET /api/v1/users
// @access  Private (Admin)
exports.getUsers = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get single user
// @route   GET /api/v1/users/:id
// @access  Private (Admin)
exports.getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(
      new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({ success: true, data: user });
});

// @desc    Create user (Admin only)
// @route   POST /api/v1/users
// @access  Private (Admin)
exports.createUser = asyncHandler(async (req, res, next) => {
  const { name, email, password, phone, role } = req.body;

  // Check if user exists
  const existingUser = await User.findOne({ email });
  console.log("skjskds", existingUser);
  if (existingUser) {
    return next(new ErrorResponse("User already exists", 400));
  }

  const user = await User.create({
    name,
    email,
    password,
    phone,
    role,
  });

  // Remove password from output
  user.password = undefined;

  res.status(201).json({ success: true, data: user });
});

// @desc    Update user
// @route   PUT /api/v1/users/:id
// @access  Private (Admin)
exports.updateUser = asyncHandler(async (req, res, next) => {
  // Don't allow password update via this route
  if (req.body.password) {
    return next(
      new ErrorResponse(
        "Please use the dedicated route for password updates",
        400
      )
    );
  }

  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    return next(
      new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
    );
  }

  // Remove password from output
  user.password = undefined;

  res.status(200).json({ success: true, data: user });
});

// @desc    Delete user
// @route   DELETE /api/v1/users/:id
// @access  Private (Admin)
exports.deleteUser = asyncHandler(async (req, res, next) => {
  // Prevent deleting yourself
  if (req.params.id === req.user.id) {
    return next(new ErrorResponse("You cannot delete yourself", 400));
  }

  const user = await User.findByIdAndDelete(req.params.id);

  if (!user) {
    return next(
      new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({ success: true, data: {} });
});

// @desc    Update user password
// @route   PUT /api/v1/users/:id/password
// @access  Private (Admin or self)
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id).select("+password");

  if (!user) {
    return next(
      new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
    );
  }

  // Check if current user is admin or the user themselves
  if (req.user.role !== "admin" && req.user.id !== req.params.id) {
    return next(
      new ErrorResponse("Not authorized to update this password", 401)
    );
  }

  // Check current password if not admin
  if (req.user.role !== "admin") {
    const isMatch = await user.comparePassword(req.body.currentPassword);
    if (!isMatch) {
      return next(new ErrorResponse("Current password is incorrect", 401));
    }
  }

  user.password = req.body.newPassword;
  await user.save();

  // Remove password from output
  user.password = undefined;

  res.status(200).json({ success: true, data: user });
});

// @desc    Deactivate user account
// @route   PUT /api/v1/users/:id/deactivate
// @access  Private (Admin)
exports.deactivateUser = asyncHandler(async (req, res, next) => {
  // Prevent deactivating yourself
  if (req.params.id === req.user.id) {
    return next(new ErrorResponse("You cannot deactivate yourself", 400));
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { active: false },
    { new: true }
  );

  if (!user) {
    return next(
      new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({ success: true, data: user });
});

// @desc    Reactivate user account
// @route   PUT /api/v1/users/:id/reactivate
// @access  Private (Admin)
exports.reactivateUser = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { active: true },
    { new: true }
  );

  if (!user) {
    return next(
      new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({ success: true, data: user });
});
