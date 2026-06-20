const express = require("express");
const router = express.Router();

const { likeRecipe } = require("../controllers/likes.controller");

router.post("/", likeRecipe);

module.exports = router;
