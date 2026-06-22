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
    const newFavorite = {
      userId: new ObjectId(userId),
      recipeId: new ObjectId(recipeId),
      addedAt: new Date(),
    };

    const result = await favoritesCollection.insertOne(newFavorite);
    if (result.acknowledged) {
      // Increment favoriteCount for the recipe
      await recipesCollection.updateOne(
        { _id: new ObjectId(recipeId) },
        { $inc: { favoriteCount: 1 } },
      );

      // Increment totalFavorites for the user
      await usersCollection.updateOne(
        { _id: new ObjectId(userId) },
        { $inc: { totalFavorites: 1 } },
      );
    }

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
    const result = await favoritesCollection.deleteOne({
      userId: new ObjectId(userId),
      recipeId: new ObjectId(recipeId),
    });

    if (result.deletedCount > 0) {
      // Decrement favoriteCount for the recipe
      await recipesCollection.updateOne(
        { _id: new ObjectId(recipeId) },
        { $inc: { favoriteCount: -1 } },
      );

      // Decrement totalFavorites for the user
      await usersCollection.updateOne(
        { _id: new ObjectId(userId) },
        { $inc: { totalFavorites: -1 } },
      );
    }

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
