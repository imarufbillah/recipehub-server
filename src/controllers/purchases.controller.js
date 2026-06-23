const express = require("express");
const router = express.Router();
const { database } = require("../config/db");
const { ObjectId } = require("mongodb");

const purchasesCollection = database.collection("purchases");

// Make a purchase
const makePurchase = async (req, res) => {
  try {
    const { userId, recipeId, amount, currency, purchasedAt, ...rest } =
      req.body;

    if (userId !== req.user?.id) {
      return res.status(401).json({ message: "Unauthorized!" });
    }

    const userObjectId = new ObjectId(userId);
    const recipeObjectId = new ObjectId(recipeId);

    const existingPurchase = await purchasesCollection.findOne(
      { userId: userObjectId, recipeId: recipeObjectId },
      { projection: { _id: 1 } },
    );

    if (existingPurchase) {
      return res.status(400).json({ message: "Recipe already purchased!" });
    }

    const newPurchase = {
      ...rest,
      userId: userObjectId,
      recipeId: recipeObjectId,
      amount: Number(amount),
      currency: currency.toLowerCase(),
      status: "completed",
      purchasedAt: new Date(purchasedAt),
      createdAt: new Date(),
    };

    const result = await purchasesCollection.insertOne(newPurchase);

    if (!result.acknowledged) {
      return res.status(500).json({ message: "Error purchasing recipe!" });
    }

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

    if (userId !== req.user?.id) {
      return res.status(401).json({ message: "Unauthorized!" });
    }

    const result = await purchasesCollection.findOne(
      {
        userId: new ObjectId(userId),
        recipeId: new ObjectId(recipeId),
      },
      { projection: { _id: 1 } },
    );

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

    if (userId !== req.user?.id) {
      return res.status(401).json({ message: "Unauthorized!" });
    }

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
            pipeline: [
              {
                $project: {
                  recipeName: 1,
                  author: 1,
                  price: 1,
                },
              },
            ],
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
        {
          $sort: { purchasedAt: -1 },
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
