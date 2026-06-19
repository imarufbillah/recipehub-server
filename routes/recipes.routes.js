const express = require("express");
const router = express.Router();

const { createRecipe } = require("../controllers/recipes.controller");

router.post("/", createRecipe);

module.exports = router;
