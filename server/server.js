const app = require("./app");
const mongoose = require("mongoose");

const PORT = process.env.PORT || 5051;

// MongoDB connection (only for non-test environment)
if (process.env.NODE_ENV !== "test") {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => console.log("✅ MongoDB connected successfully"))
    .catch((err) => console.error("❌ MongoDB connection error:", err));
}

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
