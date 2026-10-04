
const express = require("express");
const router = express.Router();

const {
  getApplications,
  saveApplication,
  updateApplication,
  deleteApplication,
} = require("../controllers/applicationController");

// List tracked applications
router.get("/", getApplications);
// Save an opportunity to the tracker
router.post("/:opportunityId/save", saveApplication);

// Update status or notes
router.patch("/:applicationId", updateApplication);

// Remove from tracker
router.delete("/:applicationId", deleteApplication);

module.exports = router;