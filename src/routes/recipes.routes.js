const express = require("express");
const router = express.Router();

const {
  createRecipe,
  getRecipesByUserId,
  updateRecipe,
  deleteRecipe,
  getAllRecipes,
} = require("../controllers/recipes.controller");

router.post("/", createRecipe);
router.get("/:userId", getRecipesByUserId);
router.patch("/:recipeId", updateRecipe);
router.delete("/:recipeId", deleteRecipe);
router.get("/", getAllRecipes);

module.exports = router;
