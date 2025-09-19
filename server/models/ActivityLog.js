const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        "account_created",
        "email_change",
        "update_displayName",
        "update_farmType",
        "update_location",
        'password_update',
        "profile_update",
        "login",
        "logout"
      ],
    },
    changes: {
      type: Object,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

activityLogSchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model("ActivityLog", activityLogSchema);
