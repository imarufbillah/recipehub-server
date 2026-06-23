const express = require("express");
const router = express.Router();

const { updateUser } = require("../controllers/users.controller");

const { verifyToken } = require("../middlewares/verifyToken");

router.patch("/:userId", verifyToken, updateUser);

module.exports = router;
