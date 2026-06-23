const express = require("express");
const router = express.Router();

const {
  updateUser,
  getTotalUsers,
} = require("../controllers/users.controller");

const { verifyToken } = require("../middlewares/verifyToken");

router.patch("/:userId", verifyToken, updateUser);
router.get("/total", verifyToken, getTotalUsers);

module.exports = router;
