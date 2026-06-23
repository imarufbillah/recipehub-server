const express = require("express");
const router = express.Router();

const {
  updateUser,
  getTotalUsers,
  getTotalPremiumMembers,
  blockUser,
  unblockUser,
  deleteUser,
  getAllUsers,
} = require("../controllers/users.controller");

const { verifyToken } = require("../middlewares/verifyToken");
const { verifyAdmin } = require("../middlewares/verifyAdmin");

router.get("/", verifyToken, verifyAdmin, getAllUsers);
router.get("/total", verifyToken, verifyAdmin, getTotalUsers);
router.get("/premium", verifyToken, verifyAdmin, getTotalPremiumMembers);
router.patch("/block/:userId", verifyToken, verifyAdmin, blockUser);
router.patch("/unblock/:userId", verifyToken, verifyAdmin, unblockUser);
router.patch("/:userId", verifyToken, updateUser);
router.delete("/:userId", verifyToken, verifyAdmin, deleteUser);

module.exports = router;
