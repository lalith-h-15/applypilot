const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    opportunity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Opportunity",
      required: true,
    },

    studentKey: {
      type: String,
      default: "demo-student",
    },

    status: {
      type: String,
      enum: ["Saved", "Applied", "Interview", "Rejected", "Offer"],
      default: "Saved",
    },

    notes: {
      type: String,
      default: "",
      maxlength: 2000,
    },

    appliedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate tracking records for the same student
// and opportunity.
applicationSchema.index(
  { studentKey: 1, opportunity: 1 },
  { unique: true }
);

module.exports = mongoose.model("Application", applicationSchema);