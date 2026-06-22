const express = require("express");
const router = express.Router();
const { database } = require("../config/db");
const { ObjectId } = require("mongodb");

const subscriptionsCollection = database.collection("subscriptions");
const usersCollection = database.collection("user");

const createSubscription = async (req, res) => {
  try {
    const payload = req.body;
    const userObjectId = new ObjectId(payload.userId);

    const [existingUser, existingStripeId, existingPriceId] = await Promise.all(
      [
        subscriptionsCollection.findOne(
          { userId: userObjectId },
          { projection: { _id: 1 } },
        ),
        subscriptionsCollection.findOne(
          { stripeSubscriptionId: payload.stripeSubscriptionId },
          { projection: { _id: 1 } },
        ),
        subscriptionsCollection.findOne(
          { stripePriceId: payload.stripePriceId },
          { projection: { _id: 1 } },
        ),
      ],
    );

    if (existingUser || existingStripeId || existingPriceId) {
      return res.status(400).json({ message: "Subscription already exists!" });
    }

    const newSubscription = {
      ...payload,
      userId: userObjectId,
      amount: Number(payload.amount),
      currentPeriodStart: new Date(payload.currentPeriodStart),
      currentPeriodEnd: new Date(payload.currentPeriodEnd),
      cancelAtPeriodEnd: false,
      canceledAt: null,
      createdAt: new Date(),
    };

    const result = await subscriptionsCollection.insertOne(newSubscription);

    if (!result.acknowledged) {
      return res.status(500).json({ message: "Error creating subscription!" });
    }

    await usersCollection.updateOne(
      { _id: userObjectId },
      { $set: { plan: payload.plan } },
    );

    res.status(201).json({ message: "Subscription created successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating subscription!" });
  }
};

module.exports = { createSubscription };
