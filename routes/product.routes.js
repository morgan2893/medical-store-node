const express = require("express");
const router = express.Router();
const productController = require("../controllers/product.controller");
const { protect, authorize } = require("../middleware/auth");
const advancedResults = require("../middleware/advancedResults");
const Product = require("../models/Product");

router
  .route("/")
  .get(
    protect,
    advancedResults(Product, {
      path: "addedBy",
      select: "name email", // for sending selected fields only
    }),
    productController.getProducts
  )
  .post(
    protect,
    authorize("admin", "manager"),
    productController.createProduct
  );

router.route("/getAll").get(protect, productController.getAll);

router
  .route("/:id")
  .get(protect, productController.getProduct)
  .put(protect, authorize("admin", "manager"), productController.updateProduct)
  .delete(
    protect,
    authorize("admin", "manager"),
    productController.deleteProduct
  );

module.exports = router;
