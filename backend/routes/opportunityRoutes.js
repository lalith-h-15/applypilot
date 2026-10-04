const express = require("express");

const {
  getEligibleOpportunities,
} = require("../controllers/opportunityController");

const router = express.Router();

router.get("/eligible", getEligibleOpportunities);

module.exports = router;