
const mongoose = require("mongoose");
const Application = require("../models/Application");
const Opportunity = require("../models/Opportunity");

const STUDENT_KEY = "demo-student";

const VALID_STATUSES = [
  "Saved",
  "Applied",
  "Interview",
  "Rejected",
  "Offer",
];

// Get all applications for the demo student
exports.getApplications = async (req, res) => {
  try {
    const applications = await Application.find({
      studentKey: STUDENT_KEY,
    })
      .populate("opportunity")
      .sort({ updatedAt: -1 });

    res.json({
      success: true,
      applications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load applications.",
    });
  }
};

// Save an opportunity to the tracker
exports.saveApplication = async (req, res) => {
  try {
    const { opportunityId } = req.params;

    if (!mongoose.isValidObjectId(opportunityId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid opportunity ID.",
      });
    }

    const opportunity = await Opportunity.findById(opportunityId);

    if (!opportunity) {
      return res.status(404).json({
        success: false,
        message: "Opportunity not found.",
      });
    }

    const application = await Application.findOneAndUpdate(
      {
        studentKey: STUDENT_KEY,
        opportunity: opportunityId,
      },
      {
        $setOnInsert: {
          status: "Saved",
          notes: "",
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    res.status(201).json({
      success: true,
      application,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This opportunity is already saved.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to save opportunity.",
    });
  }
};

// Update application status and notes
exports.updateApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status, notes } = req.body;

    if (!mongoose.isValidObjectId(applicationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid application ID.",
      });
    }

    if (
      status === undefined &&
      notes === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Provide a status or notes to update.",
      });
    }

    if (
      status !== undefined &&
      !VALID_STATUSES.includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid application status.",
      });
    }

    if (
      notes !== undefined &&
      (typeof notes !== "string" || notes.length > 2000)
    ) {
      return res.status(400).json({
        success: false,
        message: "Notes must be text up to 2000 characters.",
      });
    }

    const application = await Application.findOne({
      _id: applicationId,
      studentKey: STUDENT_KEY,
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found.",
      });
    }

    if (status !== undefined) {
      application.status = status;

      if (status === "Applied" && !application.appliedAt) {
        application.appliedAt = new Date();
      }
    }

    if (notes !== undefined) {
      application.notes = notes;
    }

    await application.save();

    res.json({
      success: true,
      application,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update application.",
    });
  }
};

// Remove an opportunity from the tracker
exports.deleteApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;

    if (!mongoose.isValidObjectId(applicationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid application ID.",
      });
    }

    const application = await Application.findOneAndDelete({
      _id: applicationId,
      studentKey: STUDENT_KEY,
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found.",
      });
    }

    res.json({
      success: true,
      message: "Application removed from tracker.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to remove application.",
    });
  }
};