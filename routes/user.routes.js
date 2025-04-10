const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const { protect, authorize } = require("../middleware/auth");
const advancedResults = require("../middleware/advancedResults");
const User = require("../models/user");

// Apply protect and authorize admin to all routes
router.use(protect);
router.use(authorize("admin"));

router
  .route("/")
  .get(advancedResults(User), userController.getUsers)
  .post(userController.createUser);

router
  .route("/:id")
  .get(userController.getUser)
  .put(userController.updateUser)
  .delete(userController.deleteUser);

router.route("/:id/password").put(userController.updatePassword);

router.route("/:id/deactivate").put(userController.deactivateUser);

router.route("/:id/reactivate").put(userController.reactivateUser);

module.exports = router;
