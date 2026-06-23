const express = require("express");
const router = express.Router();

const {
  updateUser,
  getTotalUsers,
} = require("../controllers/users.controller");

const { verifyToken } = require("../middlewares/verifyToken");
const { verifyAdmin } = require("../middlewares/verifyAdmin");

router.patch("/:userId", verifyToken, updateUser);
router.get("/total", verifyToken, verifyAdmin, getTotalUsers);

module.exports = router;
