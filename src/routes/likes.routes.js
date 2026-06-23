const express = require("express");
const router = express.Router();

const {
  likeRecipe,
  unlikeRecipe,
  getLikeStatus,
} = require("../controllers/likes.controller");

const { verifyToken } = require("../middlewares/verifyToken");

router.post("/", verifyToken, likeRecipe);
router.delete("/", verifyToken, unlikeRecipe);
router.get("/status", verifyToken, getLikeStatus);

module.exports = router;
