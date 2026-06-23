const express = require("express");
const router = express.Router();

const {
  createSubscription,
} = require("../controllers/subscriptions.controller");

const { verifyToken } = require("../middlewares/verifyToken");

router.post("/", verifyToken, createSubscription);

module.exports = router;
