const express = require("express");
const router = express.Router();
const { database } = require("../config/db");
const { ObjectId } = require("mongodb");

const favoritesCollection = database.collection("favorites");

// Add to favorites
const addToFavorites = async (req, res) => {
  try {
    const { userId, recipeId } = req.body;
    const newFavorite = {
      userId: new ObjectId(userId),
      recipeId: new ObjectId(recipeId),
      addedAt: new Date(),
    };

    await favoritesCollection.insertOne(newFavorite);
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
    await favoritesCollection.deleteOne({
      userId: new ObjectId(userId),
      recipeId: new ObjectId(recipeId),
    });

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

module.exports = {
  addToFavorites,
  removeFromFavorites,
  getFavoriteStatus,
};
