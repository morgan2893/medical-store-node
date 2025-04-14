const express = require("express");
const router = express.Router();
const stockController = require("../controllers/stock.controller");
const { protect, authorize } = require("../middleware/auth");
const advancedResults = require("../middleware/advancedResults");
const Stock = require("../models/Stock");

router
  .route("/")
  .get(
    protect,
    advancedResults(Stock, [
      {
        path: "addedBy",
        select: "name email", // for sending selected fields only
      },
      { path: "product", select: "category description manufacturer name" },
    ]),
    stockController.getStocks
  )
  .post(protect, authorize("admin", "manager"), stockController.createStock);

router
  .route("/:id")
  .get(protect, stockController.getStock)
  .put(protect, authorize("admin", "manager"), stockController.updateStock)
  .delete(protect, authorize("admin", "manager"), stockController.deleteStock);

module.exports = router;
