const express = require("express");
const router = express.Router();
const { database } = require("../config/db");
const { ObjectId } = require("mongodb");

const likesCollection = database.collection("likes");
const usersCollection = database.collection("user");
const recipesCollection = database.collection("recipes");

// Like a recipe
const likeRecipe = async (req, res) => {
  try {
    const { userId, recipeId } = req.body;
    const newLike = {
      recipeId: new ObjectId(recipeId),
      userId: new ObjectId(userId),
      createdAt: new Date(),
    };

    const result = await likesCollection.insertOne(newLike);

    if (result.acknowledged) {
      const incrementResult = await recipesCollection.updateOne(
        { _id: new ObjectId(recipeId) },
        { $inc: { likeCount: 1 } },
      );

      res.json({ message: "Recipe liked successfully!" });
    } else {
      res.status(404).json({ message: "Recipe not found!" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error liking recipe!" });
  }
};

module.exports = {
  likeRecipe,
};
