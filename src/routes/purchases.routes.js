const express = require("express");
const router = express.Router();

const {
  makePurchase,
  getPurchaseStatus,
} = require("../controllers/purchases.controller");

router.post("/", makePurchase);
router.get("/status", getPurchaseStatus);

module.exports = router;
