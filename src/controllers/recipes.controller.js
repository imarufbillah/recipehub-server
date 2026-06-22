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
    const recipeId = req.params.recipeId;
    const payload = req.body;

    const updatedRecipe = {
      ...payload,
      prepTime: Number(payload.prepTime),
      servings: Number(payload.servings),
      price: Number(payload.price),
      updatedAt: new Date(),
    };

    const result = await recipesCollection.updateOne(
      { _id: new ObjectId(recipeId) },
      { $set: updatedRecipe },
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Recipe not found!" });
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
    const recipeId = req.params.recipeId;

    const result = await recipesCollection.deleteOne({
      _id: new ObjectId(recipeId),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Recipe not found!" });
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

    // Full-text search (recipeName + description)
    if (q?.trim()) {
      const searchRegex = new RegExp(q.trim(), "i");
      filter.$or = [{ recipeName: searchRegex }, { description: searchRegex }];
    }

    // Categorical filters
    if (category) filter.category = new RegExp(`^${category}$`, "i");
    if (cuisine) filter.cuisine = new RegExp(`^${cuisine}$`, "i");
    if (difficulty) filter.difficulty = new RegExp(`^${difficulty}$`, "i");

    // Boolean filters
    if (isPremium !== undefined) filter.isPremium = isPremium === "true";
    if (isFeatured !== undefined) filter.isFeatured = isFeatured === "true";

    // Price range
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    // Prep time ceiling
    if (maxPrepTime) filter.prepTime = { $lte: parseInt(maxPrepTime, 10) };

    // Sort
    const sortMap = {
      newest: { _id: -1 },
      oldest: { _id: 1 },
      popular: { likeCount: -1 },
      price_asc: { price: 1 },
      price_desc: { price: -1 },
    };
    const sortOption = sortMap[sort] ?? { _id: -1 };

    // Pagination
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
const getAllRecipeCategories = async (req, res) => {
  try {
    const result = await recipesCollection
      .aggregate([
        {
          $group: {
            _id: "$category",
          },
        },
        {
          $project: {
            _id: 0,
            id: { $toLower: "$_id" },
            label: "$_id",
          },
        },
        {
          $sort: {
            label: 1,
          },
        },
      ])
      .toArray();

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching recipe categories!" });
  }
};

// Get all recipe cuisines with id and label: {id: "asian", label: "Asian"}
const getAllRecipeCuisines = async (req, res) => {
  try {
    const result = await recipesCollection
      .aggregate([
        {
          $group: {
            _id: "$cuisine",
          },
        },
        {
          $project: {
            _id: 0,
            id: { $toLower: "$_id" },
            label: "$_id",
          },
        },
        {
          $sort: {
            label: 1,
          },
        },
      ])
      .toArray();

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching recipe cuisines!" });
  }
};

// Get recipe by ID
const getRecipeById = async (req, res) => {
  try {
    const userId = "6a33cdbbc8e7e9cc557dcb6f";
    const recipeId = req.params.recipeId;
    const cursor = { _id: new ObjectId(recipeId) };

    // Check if the recipe has already been purchased
    const isPurchased = await purchasesCollection.findOne({
      userId: new ObjectId(userId),
      recipeId: new ObjectId(recipeId),
    });

    // Check if the recipe is premium
    const queryIsPremium = await recipesCollection.findOne(
      {
        _id: new ObjectId(recipeId),
      },
      {
        projection: {
          isPremium: 1,
          _id: 0,
        },
      },
    );
    const isPremium = queryIsPremium.isPremium;

    if (!isPurchased && isPremium) {
      const result = await recipesCollection.findOne(cursor, {
        projection: {
          ingredients: 0,
          steps: 0,
        },
      });
      return res.json(result);
    } else {
      const result = await recipesCollection.findOne(cursor);
      return res.json(result);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching recipe!" });
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
};
