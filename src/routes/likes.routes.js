const express = require("express");
const router = express.Router();

const {
  likeRecipe,
  unlikeRecipe,
  getLikeStatus,
} = require("../controllers/likes.controller");

router.post("/", likeRecipe);
router.delete("/", unlikeRecipe);
router.get("/status", getLikeStatus);

module.exports = router;
