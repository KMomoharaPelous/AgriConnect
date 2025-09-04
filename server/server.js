require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5051;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
  });

// Routes
app.get("/api/health", (req, res) => {
  res.json({ message: "🌿 AgriConnect API is running!" });
});

app.use("/api/auth", require("./routes/auth"));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
