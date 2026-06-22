const express = require("express");
const router = express.Router();

const {
  createSubscription,
} = require("../controllers/subscriptions.controller");

router.post("/", createSubscription);

module.exports = router;
