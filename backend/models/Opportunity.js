const mongoose = require("mongoose");

const opportunitySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    company: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      enum: ["Internship", "Job", "Apprenticeship"],
      required: true,
    },

    location: {
      type: String,
      required: true,
    },

    workMode: {
      type: String,
      enum: ["Remote", "Hybrid", "On-site"],
      required: true,
    },

    stipend: {
      type: Number,
      default: 0,
    },

    requiredSkills: {
      type: [String],
      default: [],
    },

    minimumCGPA: {
      type: Number,
      default: 0,
    },

    eligibleBranches: {
      type: [String],
      default: [],
    },

    eligibleGraduationYears: {
      type: [Number],
      default: [],
    },

    deadline: {
      type: Date,
      required: true,
    },

    description: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Opportunity", opportunitySchema);