const express = require("express");
const router = express.Router();

const { makePurchase } = require("../controllers/purchases.controller");

router.post("/", makePurchase);

module.exports = router;
