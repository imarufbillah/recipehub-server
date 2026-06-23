const express = require("express");
const router = express.Router();

const {
  createReport,
  getReportStatus,
} = require("../controllers/reports.controller");

const { verifyToken } = require("../middlewares/verifyToken");

router.post("/", verifyToken, createReport);
router.get("/status", verifyToken, getReportStatus);

module.exports = router;
