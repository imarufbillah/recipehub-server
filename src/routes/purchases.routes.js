const express = require("express");
const router = express.Router();

const {
  makePurchase,
  getPurchaseStatus,
  getPurchasesByUserId,
} = require("../controllers/purchases.controller");

router.post("/", makePurchase);
router.get("/status", getPurchaseStatus);
router.get("/user/:userId", getPurchasesByUserId);

module.exports = router;
