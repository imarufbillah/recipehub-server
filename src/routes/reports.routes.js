const express = require("express");
const router = express.Router();

const {
  createReport,
  getReportStatus,
  getTotalReports,
  getAllReports,
} = require("../controllers/reports.controller");

const { verifyToken } = require("../middlewares/verifyToken");
const { verifyAdmin } = require("../middlewares/verifyAdmin");

router.post("/", verifyToken, createReport);
router.get("/", verifyToken, verifyAdmin, getAllReports);
router.get("/status", verifyToken, getReportStatus);
router.get("/total", verifyToken, verifyAdmin, getTotalReports);

module.exports = router;
