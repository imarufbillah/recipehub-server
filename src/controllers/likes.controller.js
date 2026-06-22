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

    const newLike = {
      recipeId: new ObjectId(recipeId),
      userId: new ObjectId(userId),
      recipePublisher: new ObjectId(recipe.userId),
      createdAt: new Date(),
    };

    const result = await likesCollection.insertOne(newLike);

    if (!result.acknowledged) {
      return res.status(500).json({ message: "Error liking recipe!" });
    }

    await Promise.all([
      recipesCollection.updateOne(
        { _id: new ObjectId(recipeId) },
        { $inc: { likeCount: 1 } },
      ),
      usersCollection.updateOne(
        { _id: new ObjectId(recipe.userId) },
        { $inc: { totalLikes: 1 } },
      ),
    ]);

    res.json({ message: "Recipe liked successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error liking recipe!" });
  }
};

// Unlike a recipe
const unlikeRecipe = async (req, res) => {
  try {
    const { userId, recipeId } = req.body;
    const result = await likesCollection.deleteOne({
      recipeId: new ObjectId(recipeId),
      userId: new ObjectId(userId),
    });

    if (result.deletedCount > 0) {
      // Decrement likeCount for the recipe
      await recipesCollection.updateOne(
        { _id: new ObjectId(recipeId) },
        { $inc: { likeCount: -1 } },
      );

      // Decrement totalLikes for the user
      await usersCollection.updateOne(
        { _id: new ObjectId(userId) },
        { $inc: { totalLikes: -1 } },
      );

      res.json({ message: "Recipe unliked successfully!" });
    } else {
      res.status(404).json({ message: "Recipe not found!" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error unliking recipe!" });
  }
};

// Get and check like status, returns true or false
const getLikeStatus = async (req, res) => {
  try {
    const { userId, recipeId } = req.query;
    const result = await likesCollection.findOne({
      recipeId: new ObjectId(recipeId),
      userId: new ObjectId(userId),
    });
    res.json(result !== null);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error checking like status!" });
  }
};

module.exports = {
  likeRecipe,
  unlikeRecipe,
  getLikeStatus,
};
