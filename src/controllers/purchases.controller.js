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
      purchasedAt: new Date(),
      createdAt: new Date(),
    };

    const result = await purchasesCollection.insertOne(newPurchase);
    res.json({ message: "Recipe purchase success!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error purchasing recipe!" });
  }
};

module.exports = {
  makePurchase,
};
