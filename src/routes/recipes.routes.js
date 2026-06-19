const express = require("express");
const router = express.Router();

const {
  createRecipe,
  getRecipesByUserId,
  updateRecipe,
  deleteRecipe,
} = require("../controllers/recipes.controller");

router.post("/", createRecipe);
router.get("/:userId", getRecipesByUserId);
router.patch("/:recipeId", updateRecipe);
router.delete("/:recipeId", deleteRecipe);

module.exports = router;
