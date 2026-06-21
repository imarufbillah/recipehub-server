const express = require("express");
const router = express.Router();

const {
  createReport,
  getReportStatus,
} = require("../controllers/reports.controller");

router.post("/", createReport);
router.get("/status", getReportStatus);

module.exports = router;
