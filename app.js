const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const bodyParser = require("body-parser");
// const errorHandler = require("./utils/errorHandler");
const connectDB = require("./config/db");

// Route files
const authRoutes = require("./routes/auth.routes");
const productRoutes = require("./routes/product.routes");
const stockRoutes = require("./routes/stock.routes");
const customerRoutes = require("./routes/customer.routes");
const transactionRoutes = require("./routes/transaction.routes");
// const smsRoutes = require("./routes/sms.routes");
const userRoutes = require("./routes/user.routes");
const billRoutes = require("./routes/bill.routes");
const { errorHandler } = require("./utils/errorHandler");

// Connect to database
connectDB();

const app = express();

// Body parser
app.use(bodyParser.json());

// Dev logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Enable CORS
app.use(cors());

// Mount routers
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/stocks", stockRoutes);
app.use("/api/v1/customers", customerRoutes);
app.use("/api/v1/transactions", transactionRoutes);
// app.use("/api/v1/sms", smsRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/bills", billRoutes);

// Error handler middleware
app.use(errorHandler);

module.exports = app;
