const express = require("express");
const router = express.Router();

const {
  createRecipe,
  getRecipesByUserId,
  updateRecipe,
} = require("../controllers/recipes.controller");

router.post("/", createRecipe);
router.get("/:userId", getRecipesByUserId);
router.patch("/:recipeId", updateRecipe);

module.exports = router;
