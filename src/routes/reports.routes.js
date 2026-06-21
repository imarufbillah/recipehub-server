const express = require("express");
const router = express.Router();

const { createReport } = require("../controllers/reports.controller");

router.post("/", createReport);

module.exports = router;
