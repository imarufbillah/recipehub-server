const express = require("express");
const router = express.Router();

const {
  createRecipe,
  getRecipesByUserId,
  updateRecipe,
  deleteRecipe,
  getAllRecipes,
  getAllRecipeCategories,
  getRecipeById,
} = require("../controllers/recipes.controller");

router.post("/", createRecipe);
router.get("/categories", getAllRecipeCategories);
router.get("/:userId", getRecipesByUserId);
router.patch("/:recipeId", updateRecipe);
router.delete("/:recipeId", deleteRecipe);
router.get("/", getAllRecipes);
router.get("/:recipeId", getRecipeById);

module.exports = router;
