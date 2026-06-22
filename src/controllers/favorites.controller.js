const express = require("express");
const router = express.Router();
const { database } = require("../config/db");
const { ObjectId } = require("mongodb");

const favoritesCollection = database.collection("favorites");
const recipesCollection = database.collection("recipes");
const usersCollection = database.collection("user");

// Add to favorites
const addToFavorites = async (req, res) => {
  try {
    const { userId, recipeId } = req.body;

    const recipe = await recipesCollection.findOne(
      { _id: new ObjectId(recipeId) },
      {
        projection: {
          userId: 1,
        },
      },
    );

    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found!" });
    }

    const newFavorite = {
      userId: new ObjectId(userId),
      recipeId: new ObjectId(recipeId),
      recipePublisher: new ObjectId(recipe.userId),
      addedAt: new Date(),
    };

    const result = await favoritesCollection.insertOne(newFavorite);

    if (!result.acknowledged) {
      return res.status(500).json({ message: "Error adding to favorites!" });
    }

    await Promise.all([
      recipesCollection.updateOne(
        { _id: new ObjectId(recipeId) },
        { $inc: { favoriteCount: 1 } },
      ),
      usersCollection.updateOne(
        { _id: new ObjectId(recipe.userId) },
        { $inc: { totalFavorites: 1 } },
      ),
    ]);

    res.json({ message: "Recipe added to favorites!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error adding to favorites!" });
  }
};

// Remove favorite
const removeFromFavorites = async (req, res) => {
  try {
    const { userId, recipeId } = req.body;

    const recipe = await recipesCollection.findOne(
      { _id: new ObjectId(recipeId) },
      {
        projection: {
          userId: 1,
        },
      },
    );

    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found!" });
    }

    const result = await favoritesCollection.deleteOne({
      userId: new ObjectId(userId),
      recipeId: new ObjectId(recipeId),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Favorite not found!" });
    }

    await Promise.all([
      recipesCollection.updateOne(
        { _id: new ObjectId(recipeId) },
        { $inc: { favoriteCount: -1 } },
      ),
      usersCollection.updateOne(
        { _id: new ObjectId(recipe.userId) },
        { $inc: { totalFavorites: -1 } },
      ),
    ]);

    res.json({ message: "Recipe removed from favorites!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error removing from favorites!" });
  }
};

// Get favorite status
const getFavoriteStatus = async (req, res) => {
  try {
    const { userId, recipeId } = req.query;
    const result = await favoritesCollection.findOne({
      userId: new ObjectId(userId),
      recipeId: new ObjectId(recipeId),
    });

    res.json(result !== null);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error checking favorite status!" });
  }
};

// Get favorites by user ID (includes recipe details)
const getFavoritesByUserId = async (req, res) => {
  try {
    const userId = req.params.userId;

    const result = await favoritesCollection
      .aggregate([
        {
          $match: {
            userId: new ObjectId(userId),
          },
        },
        {
          $lookup: {
            from: "recipes",
            localField: "recipeId",
            foreignField: "_id",
            as: "recipe",
          },
        },
        {
          $unwind: "$recipe",
        },
        {
          $project: {
            _id: 0,
            addedAt: 1,
            recipeId: "$recipe._id",
            recipeName: "$recipe.recipeName",
            category: "$recipe.category",
            isPremium: "$recipe.isPremium",
            author: "$recipe.author",
          },
        },
      ])
      .toArray();

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching favorites!" });
  }
};

module.exports = {
  addToFavorites,
  removeFromFavorites,
  getFavoriteStatus,
  getFavoritesByUserId,
};
