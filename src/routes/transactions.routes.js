const express = require("express");
const router = express.Router();

const {
  getTransactionStats,
} = require("../controllers/transactions.controller");

const { verifyToken } = require("../middlewares/verifyToken");
const { verifyAdmin } = require("../middlewares/verifyAdmin");

router.get("/stats", verifyToken, verifyAdmin, getTransactionStats);

module.exports = router;
