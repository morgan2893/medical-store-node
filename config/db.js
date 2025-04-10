const mongoose = require("mongoose");
require("dotenv").config();

const uri =
  "mongodb+srv://somethig98:mukesh222893@medi-store.2ojbyam.mongodb.net/?retryWrites=true&w=majority&appName=medi-store";
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: false,
      useUnifiedTopology: false,
    });
    console.log("MongoDB Connected...");
  } catch (err) {
    console.error("Database connection error:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
