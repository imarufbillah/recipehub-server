const express = require("express");
const router = express.Router();
const { database } = require("../config/db");
const { ObjectId } = require("mongodb");

const purchasesCollection = database.collection("purchases");

// Make a purchase
const makePurchase = async (req, res) => {
  try {
    const payload = req.body;
    const newPurchase = {
      ...payload,
      userId: new ObjectId(payload.userId),
      recipeId: new ObjectId(payload.recipeId),
      amount: Number(payload.amount),
      currency: payload.currency.toLowerCase(),
      status: "completed",
      purchasedAt: new Date(payload.purchasedAt),
      createdAt: new Date(),
    };

    // Check if the recipe has already been purchased
    const existingPurchase = await purchasesCollection.findOne({
      userId: new ObjectId(payload.userId),
      recipeId: new ObjectId(payload.recipeId),
    });

    if (existingPurchase) {
      return res.status(400).json({ message: "Recipe already purchased!" });
    }

    const result = await purchasesCollection.insertOne(newPurchase);
    res.json({ message: "Recipe purchase success!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error purchasing recipe!" });
  }
};

// Get purchase status
const getPurchaseStatus = async (req, res) => {
  try {
    const { userId, recipeId } = req.query;
    const result = await purchasesCollection.findOne({
      userId: new ObjectId(userId),
      recipeId: new ObjectId(recipeId),
    });

    res.json(result !== null);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error checking purchase status!" });
  }
};

// Get purchases by user ID (includes recipeName, author, price, ...)
const getPurchasesByUserId = async (req, res) => {
  try {
    const userId = req.params.userId;

    const result = await purchasesCollection
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
            purchasedAt: 1,
            recipeName: "$recipe.recipeName",
            recipeId: "$recipe._id",
            author: "$recipe.author",
            price: "$recipe.price",
            stripePaymentIntentId: 1,
          },
        },
      ])
      .toArray();

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching purchases!" });
  }
};

module.exports = {
  makePurchase,
  getPurchaseStatus,
  getPurchasesByUserId,
};
