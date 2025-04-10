const express = require("express");
const router = express.Router();
const transactionController = require("../controllers/transaction.controller");
const { protect } = require("../middleware/auth");
const advancedResults = require("../middleware/advancedResults");
const Transaction = require("../models/Transaction");

router
  .route("/")
  .get(
    protect,
    advancedResults(Transaction, ["customer", "processedBy"]),
    transactionController.getTransactions
  )
  .post(protect, transactionController.createTransaction);

router.route("/:id").get(protect, transactionController.getTransaction);

router
  .route("/customer/:customerId")
  .get(protect, transactionController.getTransactionsByCustomer);

module.exports = router;
