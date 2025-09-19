const ActivityLog = require("../models/ActivityLog");

class ActivityLogger {
  /**
   * Log an activity for a user
   * @param {String} userId - User's MongoDB ObjectId
   * @param {String} action - Action type
   * @param {Object} changes - Object containing what changed
   */
  static async logActivity(uesrId, action, changes) {
    try {
      const logEntry = new ActivityLog({
        userId,
        action,
        changes,
      });

      await logEntry.save();
      console.log(`Activity logged: ${action} for user ${userId}`);
    } catch (error) {
      console.error("Error logging activity:", error);
    }
  }

  /** Get recent activity for a user (last 50 entries)
   * @param {String} userId
   * @returns {Array} Array of activity log entries
   */

  static async getUserActivity(userId, limit = 50) {
    try {
      const activites = await ActivityLog.find({ userId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean();

      return activities;
    } catch (error) {
      console.error("Error getting user activity:", error);
      return [];
    }
  }

  /**
   * Helper to format profile update changes
   * @param {Object} oldValues - Original Values
   * @param {Object} newValues - New Values
   * @returns {Object} Formatted changes object
   */

  static formatProfileChanges(oldValues, newValues) {
    const changes = {};

    // Check each field for changes
    const fieldsToCheck = [
      "name",
      "displayName",
      "email",
      "location",
      "farmType",
    ];

    fieldsToCheck.forEach((field) => {
      if (
        newValues[field] !== undefined &&
        oldValues[field] !== newValues[field]
      ) {
        changes[field] = {
          from: oldValues[field],
          to: newValues[field],
        };
      }
    });

    return changes;
  }
}

module.exports = ActivityLogger;
