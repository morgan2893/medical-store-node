const express = require("express");
const router = express.Router();
const smsController = require("../controllers/sms.controller");
const { protect, authorize } = require("../middleware/auth");

router
  .route("/notify-availability")
  .post(
    protect,
    authorize("admin", "manager"),
    smsController.notifyProductAvailability
  );

router
  .route("/payment-reminder")
  .post(
    protect,
    authorize("admin", "manager"),
    smsController.sendPaymentReminder
  );

router
  .route("/custom")
  .post(protect, authorize("admin", "manager"), smsController.sendCustomSMS);

module.exports = router;
