const express = require("express");
const router = express.Router();

const {
  createRecipe,
  getRecipesByUserId,
} = require("../controllers/recipes.controller");

router.post("/", createRecipe);
router.get("/:userId", getRecipesByUserId);

module.exports = router;
