const express = require("express");
const router = express.Router();
const { database } = require("../config/db");
const { ObjectId } = require("mongodb");

const recipesCollection = database.collection("recipes");
const usersCollection = database.collection("user");
const purchasesCollection = database.collection("purchases");

// Create a new recipe
const createRecipe = async (req, res) => {
  try {
    const {
      recipeName,
      description,
      category,
      cuisine,
      difficulty,
      prepTime,
      servings,
      isPremium,
      price,
      imageUrl,
      ingredients,
      steps,
      userId,
      author,
    } = req.body;

    if (
      !recipeName ||
      !description ||
      !category ||
      !cuisine ||
      !difficulty ||
      !prepTime ||
      !servings ||
      !imageUrl ||
      !userId ||
      !author
    ) {
      return res.status(400).json({ message: "Missing required fields!" });
    }

    if (userId !== req.user?.id) {
      return res.status(401).json({ message: "Unauthorized!" });
    }

    const userObjectId = new ObjectId(userId);

    const user = await usersCollection.findOne(
      { _id: userObjectId },
      { projection: { plan: 1, recipes: 1 } },
    );

    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    if (user.plan === "free" && user.recipes >= 2) {
      return res.status(400).json({ message: "Free plan limit reached!" });
    }

    const newRecipe = {
      recipeName,
      description,
      category,
      cuisine,
      difficulty,
      prepTime: Number(prepTime),
      servings: Number(servings),
      isPremium,
      price: Number(price),
      imageUrl,
      ingredients,
      steps,
      userId: userObjectId,
      author,
      createdAt: new Date(),
      status: "active",
      isFeatured: false,
      likeCount: 0,
      favoriteCount: 0,
    };

    const result = await recipesCollection.insertOne(newRecipe);

    if (!result.acknowledged) {
      return res.status(500).json({ message: "Error creating recipe!" });
    }

    await usersCollection.updateOne(
      { _id: userObjectId },
      { $inc: { recipes: 1 } },
    );

    res.status(201).json({
      message: "Recipe created successfully!",
      recipeId: result.insertedId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating recipe!" });
  }
};

// Get recipes by user ID
const getRecipesByUserId = async (req, res) => {
  try {
    const userId = req.params.userId;

    if (userId !== req.user?.id) {
      return res.status(401).json({ message: "Unauthorized!" });
    }

    const result = await recipesCollection
      .find({ userId: new ObjectId(userId) })
      .sort({ createdAt: -1 })
      .toArray();

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching recipes!" });
  }
};

// Update a recipe
const updateRecipe = async (req, res) => {
  try {
    const { recipeId } = req.params;
    const isAdmin = req.user?.role === "admin";

    const filter = isAdmin
      ? { _id: new ObjectId(recipeId) }
      : { _id: new ObjectId(recipeId), userId: new ObjectId(req.user?.id) };

    const updatedRecipe = {
      ...req.body,
      prepTime: Number(req.body.prepTime),
      servings: Number(req.body.servings),
      price: Number(req.body.price),
      updatedAt: new Date(),
    };

    const result = await recipesCollection.updateOne(filter, {
      $set: updatedRecipe,
    });

    if (result.matchedCount === 0) {
      return res
        .status(isAdmin ? 404 : 403)
        .json({ message: isAdmin ? "Recipe not found!" : "Forbidden!" });
    }

    res.json({ message: "Recipe updated successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating recipe!" });
  }
};

// Delete a recipe
const deleteRecipe = async (req, res) => {
  try {
    const { recipeId } = req.params;
    const isAdmin = req.user?.role === "admin";

    const filter = isAdmin
      ? { _id: new ObjectId(recipeId) }
      : { _id: new ObjectId(recipeId), userId: new ObjectId(req.user?.id) };

    const result = await recipesCollection.deleteOne(filter);

    if (result.deletedCount === 0) {
      return res
        .status(isAdmin ? 404 : 403)
        .json({ message: isAdmin ? "Recipe not found!" : "Forbidden!" });
    }

    res.json({ message: "Recipe deleted successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting recipe!" });
  }
};

// Get all recipes
const getAllRecipes = async (req, res) => {
  try {
    const {
      q,
      category,
      cuisine,
      difficulty,
      isPremium,
      isFeatured,
      minPrice,
      maxPrice,
      maxPrepTime,
      sort,
      page,
      limit,
    } = req.query;

    const filter = {};

    if (q?.trim()) {
      const searchRegex = new RegExp(q.trim(), "i");
      filter.$or = [{ recipeName: searchRegex }, { description: searchRegex }];
    }

    if (category) {
      const categories = category
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);
      filter.category = {
        $in: categories.map((c) => new RegExp(`^${c}$`, "i")),
      };
    }

    if (cuisine) filter.cuisine = new RegExp(`^${cuisine}$`, "i");
    if (difficulty) filter.difficulty = new RegExp(`^${difficulty}$`, "i");

    if (isPremium !== undefined) filter.isPremium = isPremium === "true";
    if (isFeatured !== undefined) filter.isFeatured = isFeatured === "true";

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    if (maxPrepTime) filter.prepTime = { $lte: parseInt(maxPrepTime, 10) };

    const sortMap = {
      newest: { _id: -1 },
      oldest: { _id: 1 },
      popular: { likeCount: -1 },
      price_asc: { price: 1 },
      price_desc: { price: -1 },
    };
    const sortOption = sortMap[sort] ?? { _id: -1 };

    const pageNum = Math.max(1, parseInt(page ?? "1", 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(limit ?? "12", 10)));
    const skip = (pageNum - 1) * pageSize;

    const projection = {
      recipeName: 1,
      description: 1,
      category: 1,
      cuisine: 1,
      difficulty: 1,
      prepTime: 1,
      servings: 1,
      imageUrl: 1,
      isPremium: 1,
      isFeatured: 1,
      price: 1,
      author: 1,
      likeCount: 1,
      favoriteCount: 1,
      status: 1,
      createdAt: 1,
    };

    const [recipes, total] = await Promise.all([
      recipesCollection
        .find(filter, { projection })
        .sort(sortOption)
        .skip(skip)
        .limit(pageSize)
        .toArray(),
      recipesCollection.countDocuments(filter),
    ]);

    res.json({
      recipes,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / pageSize),
      limit: pageSize,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching recipes!" });
  }
};

// Get all recipe categories
let categoriesCache = null;
let categoriesCachedAt = null;
const CATEGORIES_TTL = 5 * 60 * 1000; // 5 minutes

const getAllRecipeCategories = async (req, res) => {
  try {
    const now = Date.now();

    if (categoriesCache && now - categoriesCachedAt < CATEGORIES_TTL) {
      return res.json(categoriesCache);
    }

    const result = await recipesCollection
      .aggregate([
        { $group: { _id: "$category" } },
        {
          $project: {
            _id: 0,
            id: { $toLower: "$_id" },
            label: "$_id",
          },
        },
        { $sort: { label: 1 } },
      ])
      .toArray();

    categoriesCache = result;
    categoriesCachedAt = now;

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching recipe categories!" });
  }
};

// Get all recipe cuisines with id and label: {id: "asian", label: "Asian"}
let cuisinesCache = null;
let cuisinesCachedAt = null;
const CUISINES_TTL = 5 * 60 * 1000; // 5 minutes

const getAllRecipeCuisines = async (req, res) => {
  try {
    const now = Date.now();

    if (cuisinesCache && now - cuisinesCachedAt < CUISINES_TTL) {
      return res.json(cuisinesCache);
    }

    const result = await recipesCollection
      .aggregate([
        { $group: { _id: "$cuisine" } },
        {
          $project: {
            _id: 0,
            id: { $toLower: "$_id" },
            label: "$_id",
          },
        },
        { $sort: { label: 1 } },
      ])
      .toArray();

    cuisinesCache = result;
    cuisinesCachedAt = now;

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching recipe cuisines!" });
  }
};

// Get recipe by ID
const getRecipeById = async (req, res) => {
  try {
    const { recipeId } = req.params;
    // TODO: Add auth middleware to get user ID
    const userId = "6a33cdbbc8e7e9cc557dcb6f"; // or req.user?.id if using auth middleware

    const recipeObjectId = new ObjectId(recipeId);

    const [recipe, isPurchased] = await Promise.all([
      recipesCollection.findOne({ _id: recipeObjectId }),
      userId
        ? purchasesCollection.findOne(
            {
              userId: new ObjectId(userId),
              recipeId: recipeObjectId,
            },
            { projection: { _id: 1 } },
          )
        : Promise.resolve(null),
    ]);

    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found!" });
    }

    const isOwner = userId && recipe.userId.equals(new ObjectId(userId));

    if (recipe.isPremium && !isPurchased && !isOwner) {
      const { ingredients, steps, ...publicRecipe } = recipe;
      return res.json(publicRecipe);
    }

    res.json(recipe);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching recipe!" });
  }
};

// Get total recipes
const getTotalRecipes = async (req, res) => {
  try {
    const total = await recipesCollection.countDocuments();
    res.json({ totalRecipes: total });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching total recipes!" });
  }
};

// Get all recipes (admin)
const getAllRecipesAdmin = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page ?? "1", 10));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit ?? "20", 10)),
    );
    const skip = (page - 1) * limit;

    const projection = {
      recipeName: 1,
      author: 1,
      category: 1,
      createdAt: 1,
      likeCount: 1,
      status: 1,
      isFeatured: 1,
    };

    const [recipes, total] = await Promise.all([
      recipesCollection
        .find({}, { projection })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      recipesCollection.countDocuments(),
    ]);

    res.json({ recipes, totalPages: Math.ceil(total / limit), page });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching recipes!" });
  }
};

// toggleFeature a recipe (admin)
const featureRecipe = async (req, res) => {
  try {
    const { recipeId } = req.params;
    const recipeObjectId = new ObjectId(recipeId);

    const recipe = await recipesCollection.findOne(
      { _id: recipeObjectId },
      { projection: { status: 1, isFeatured: 1 } },
    );

    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found!" });
    }

    if (recipe.status === "flagged") {
      return res
        .status(400)
        .json({ message: "Flagged recipes cannot be featured!" });
    }

    await recipesCollection.updateOne({ _id: recipeObjectId }, [
      { $set: { isFeatured: { $not: "$isFeatured" }, updatedAt: "$$NOW" } },
    ]);

    const action = recipe.isFeatured ? "unfeatured" : "featured";
    res.json({ message: `Recipe ${action} successfully!` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating featured status!" });
  }
};

module.exports = {
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
};
