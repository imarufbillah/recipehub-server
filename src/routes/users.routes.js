const express = require("express");
const router = express.Router();

const { updateUser } = require("../controllers/users.controller");

router.patch("/:userId", updateUser);

module.exports = router;
