const express = require("express");
const router = express.Router();

const {
  updateUser,
  getTotalUsers,
  getTotalPremiumMembers,
  blockUser,
  unblockUser,
} = require("../controllers/users.controller");

const { verifyToken } = require("../middlewares/verifyToken");
const { verifyAdmin } = require("../middlewares/verifyAdmin");

router.patch("/:userId", verifyToken, updateUser);
router.get("/total", verifyToken, verifyAdmin, getTotalUsers);
router.get("/premium", verifyToken, verifyAdmin, getTotalPremiumMembers);
router.patch("/block/:userId", verifyToken, verifyAdmin, blockUser);
router.patch("/unblock/:userId", verifyToken, verifyAdmin, unblockUser);

module.exports = router;
