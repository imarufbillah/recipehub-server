const express = require("express");
const router = express.Router();

const {
  createReport,
  getReportStatus,
  getTotalReports,
  getAllReports,
  reviewReport,
  getTotalPendingReports,
} = require("../controllers/reports.controller");

const { verifyToken } = require("../middlewares/verifyToken");
const { verifyAdmin } = require("../middlewares/verifyAdmin");

router.post("/", verifyToken, createReport);
router.get("/", verifyToken, verifyAdmin, getAllReports);
router.get("/status", verifyToken, getReportStatus);
router.get("/total", verifyToken, verifyAdmin, getTotalReports);
router.get("/pending", verifyToken, verifyAdmin, getTotalPendingReports);
router.patch("/review/:reportId", verifyToken, verifyAdmin, reviewReport);

module.exports = router;
