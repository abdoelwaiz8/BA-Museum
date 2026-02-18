const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();

const { testConnection } = require("./config/supabase");
const { notFound, errorHandler } = require("./utils/errorHandler"); // Pastikan file ini ada dari project lama

// Import Routes
const authRoutes = require("./routes/authRoutes");
const baRoutes = require("./routes/baRoutes");

const app = express();

// Security & Config
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Museum Inventory API is running",
    version: "1.0.0"
  });
});

// Register Routes
app.use("/api/auth", authRoutes);
app.use("/api/berita-acara", baRoutes);

// Error Handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    const connected = await testConnection();
    if (!connected) process.exit(1);

    app.listen(PORT, () => {
      console.log(`🚀 Museum Backend running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
  }
};

startServer();

module.exports = app;