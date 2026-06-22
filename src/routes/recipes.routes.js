const express = require("express");
const router = express.Router();

const {
  createRecipe,
  getRecipesByUserId,
  updateRecipe,
  deleteRecipe,
  getAllRecipes,
  getAllRecipeCategories,
  getAllRecipeCuisines,
  getRecipeById,
} = require("../controllers/recipes.controller");

router.post("/", createRecipe);
router.get("/", getAllRecipes);
router.get("/categories", getAllRecipeCategories);
router.get("/cuisines", getAllRecipeCuisines);
router.get("/user/:userId", getRecipesByUserId);
router.get("/:recipeId", getRecipeById);
router.patch("/:recipeId", updateRecipe);
router.delete("/:recipeId", deleteRecipe);

module.exports = router;
