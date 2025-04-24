const express = require("express");
const router = express.Router();
const billController = require("../controllers/bill.controller");
const { protect, authorize } = require("../middleware/auth");
const advancedResults = require("../middleware/advancedResults");
const Bill = require("../models/Bill");

router
  .route("/")
  .get(protect, advancedResults(Bill, "billNo"), billController.getBills)
  .post(protect, billController.createBill);

router.get("/download/:fileId", billController.downloadFile);
module.exports = router;
