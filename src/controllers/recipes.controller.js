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
      userId: new ObjectId(userId),
      author: author || "Unknown",
      createdAt: new Date(),
      status: "active",
      isFeatured: false,
      likeCount: 0,
      favoriteCount: 0,
    };

    // Check if the user plan is free and published recipes are less than 2
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
    if (user.plan === "free" && user.recipes >= 2) {
      return res.status(400).json({ message: "Free plan limit reached!" });
    }

    const result = await recipesCollection.insertOne(newRecipe);

    await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
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
    const cursor = { userId: new ObjectId(userId) };

    const result = await recipesCollection.find(cursor).toArray();
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

    cursor = { _id: new ObjectId(recipeId) };

    const result = await recipesCollection.updateOne(cursor, {
      $set: updatedRecipe,
    });

    if (result.modifiedCount > 0) {
      res.json({ message: "Recipe updated successfully!" });
    } else {
      res.status(404).json({ message: "Recipe not found!" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating recipe!" });
  }
};

// Delete a recipe
const deleteRecipe = async (req, res) => {
  try {
    const recipeId = req.params.recipeId;
    const cursor = { _id: new ObjectId(recipeId) };

    const result = await recipesCollection.deleteOne(cursor);

    if (result.deletedCount > 0) {
      res.json({ message: "Recipe deleted successfully!" });
    } else {
      res.status(404).json({ message: "Recipe not found!" });
    }
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
      filter.$or = [
        { recipeName: { $regex: q.trim(), $options: "i" } },
        { description: { $regex: q.trim(), $options: "i" } },
      ];
    }

    // Categorical filters
    if (category) filter.category = { $regex: `^${category}$`, $options: "i" };
    if (cuisine) filter.cuisine = { $regex: `^${cuisine}$`, $options: "i" };
    if (difficulty)
      filter.difficulty = { $regex: `^${difficulty}$`, $options: "i" };

    // Boolean filters
    if (isPremium !== undefined) filter.isPremium = isPremium === "true";
    if (isFeatured !== undefined) filter.isFeatured = isFeatured === "true";

    // Price range (only meaningful for premium recipes)
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
    const sortOption = sortMap[sort] ?? { _id: -1 }; // default: newest

    // Pagination
    const pageNum = Math.max(1, parseInt(page ?? "1", 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(limit ?? "12", 10)));
    const skip = (pageNum - 1) * pageSize;

    // Query
    const [result, total] = await Promise.all([
      recipesCollection
        .find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(pageSize)
        .toArray(),
      recipesCollection.countDocuments(filter),
    ]);

    res.json({
      recipes: result,
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
            category: "$_id",
          },
        },
      ])
      .toArray();
    res.json(result.map((item) => item.category));
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
