const express = require("express");
const router = express.Router();

const {
  getTransactionStats,
  getTransactions,
} = require("../controllers/transactions.controller");

const { verifyToken } = require("../middlewares/verifyToken");
const { verifyAdmin } = require("../middlewares/verifyAdmin");

router.get("/stats", verifyToken, verifyAdmin, getTransactionStats);
router.get("/", verifyToken, verifyAdmin, getTransactions);

module.exports = router;
