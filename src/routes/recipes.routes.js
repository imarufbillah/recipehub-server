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
  getTotalRecipes,
  getAllRecipesAdmin,
  featureRecipe,
  getFeaturedRecipes,
} = require("../controllers/recipes.controller");

const { verifyToken } = require("../middlewares/verifyToken");
const { verifyAdmin } = require("../middlewares/verifyAdmin");

router.post("/", verifyToken, createRecipe);
router.get("/", getAllRecipes);
router.get("/categories", getAllRecipeCategories);
router.get("/cuisines", getAllRecipeCuisines);
router.get("/total", verifyToken, verifyAdmin, getTotalRecipes);
router.get("/admin", verifyToken, verifyAdmin, getAllRecipesAdmin);
router.get("/featured", getFeaturedRecipes);
router.patch("/feature/:recipeId", verifyToken, verifyAdmin, featureRecipe);
router.get("/user/:userId", verifyToken, getRecipesByUserId);
router.get("/:recipeId", getRecipeById);
router.patch("/:recipeId", verifyToken, updateRecipe);
router.delete("/:recipeId", verifyToken, deleteRecipe);

module.exports = router;
