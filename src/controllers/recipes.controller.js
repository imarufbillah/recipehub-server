const express = require("express");
const router = express.Router();
const { database } = require("../config/db");
const { ObjectId } = require("mongodb");

const recipesCollection = database.collection("recipes");
const usersCollection = database.collection("user");

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
      !userId
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
      createdAt: new Date(),
      status: "active",
    };

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
    const result = await recipesCollection.find().toArray();
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching recipes!" });
  }
};

module.exports = {
  createRecipe,
  getRecipesByUserId,
  updateRecipe,
  deleteRecipe,
  getAllRecipes,
};
