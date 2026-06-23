const express = require("express");
const router = express.Router();

const {
  makePurchase,
  getPurchaseStatus,
  getPurchasesByUserId,
} = require("../controllers/purchases.controller");

const { verifyToken } = require("../middlewares/verifyToken");

router.post("/", verifyToken, makePurchase);
router.get("/status", verifyToken, getPurchaseStatus);
router.get("/user/:userId", verifyToken, getPurchasesByUserId);

module.exports = router;
