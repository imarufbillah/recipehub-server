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

module.exports = {
  addToFavorites,
  removeFromFavorites,
};
