const express = require("express");
const router = express.Router();
const customerController = require("../controllers/customer.controller");
const { protect, authorize } = require("../middleware/auth");
const advancedResults = require("../middleware/advancedResults");
const Customer = require("../models/Customer");

router
  .route("/")
  .get(
    protect,
    advancedResults(Customer, "createdBy"),
    customerController.getCustomers
  )
  .post(protect, customerController.createCustomer);

router.route("/getAll").get(protect, customerController.getAll);

router
  .route("/:id")
  .get(protect, customerController.getCustomer)
  .put(protect, customerController.updateCustomer)
  .delete(
    protect,
    authorize("admin", "manager"),
    customerController.deleteCustomer
  );

router
  .route("/:id/balance")
  .get(protect, customerController.getCustomerBalance)
  .put(protect, customerController.updateCustomerBalance);

module.exports = router;
