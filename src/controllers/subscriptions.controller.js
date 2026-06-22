const express = require("express");
const router = express.Router();
const { database } = require("../config/db");
const { ObjectId } = require("mongodb");

const subscriptionsCollection = database.collection("subscriptions");
const usersCollection = database.collection("user");

const createSubscription = async (req, res) => {
  try {
    const payload = req.body;
    const newSubscription = {
      ...payload,
      userId: new ObjectId(payload.userId),
      amount: Number(payload.amount),
      currentPeriodStart: new Date(payload.currentPeriodStart),
      currentPeriodEnd: new Date(payload.currentPeriodEnd),
      cancelAtPeriodEnd: false,
      canceledAt: null,
      createdAt: new Date(),
    };

    const existingSubscription = await subscriptionsCollection.findOne({
      userId: new ObjectId(payload.userId),
    });

    if (existingSubscription) {
      return res.status(400).json({ message: "Subscription already exists!" });
    }

    // Check if stripeSubscriptionId and stripePriceId already exist
    const existingSubscriptionId = await subscriptionsCollection.findOne({
      stripeSubscriptionId: payload.stripeSubscriptionId,
    });
    const existingPriceId = await subscriptionsCollection.findOne({
      stripePriceId: payload.stripePriceId,
    });

    if (existingSubscriptionId || existingPriceId) {
      return res.status(400).json({ message: "Subscription already exists!" });
    }

    const result = await subscriptionsCollection.insertOne(newSubscription);

    if (result.acknowledged) {
      // change plan in users collection
      await usersCollection.updateOne(
        { _id: new ObjectId(payload.userId) },
        { $set: { plan: payload.plan } },
      );
    }

    res.json({ message: "Subscription created successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating subscription!" });
  }
};

module.exports = { createSubscription };
