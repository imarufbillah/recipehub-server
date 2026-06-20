const express = require("express");
const router = express.Router();

const { likeRecipe, unlikeRecipe } = require("../controllers/likes.controller");

router.post("/", likeRecipe);
router.delete("/", unlikeRecipe);

module.exports = router;
