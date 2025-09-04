const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    location: {
      type: String,
      trim: true,
    },
    farmType: {
      type: String,
      enum: ["hobby", "small-scale", "commercial", "gardener"],
      default: "hobby",
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

module.exports = mongoose.model("User", userSchema);
