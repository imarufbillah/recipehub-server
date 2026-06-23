const express = require("express");
const router = express.Router();
const { database } = require("../config/db");
const { ObjectId } = require("mongodb");

const subscriptionsCollection = database.collection("subscriptions");
const purchasesCollection = database.collection("purchases");

// Get all transactions
const getTransactions = async (req, res) => {
  try {
    const { type, status, from, to, q, page, limit } = req.query;

    const pageNum = Math.max(1, parseInt(page ?? "1", 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(limit ?? "20", 10)));
    const skip = (pageNum - 1) * pageSize;

    // type filter — skip irrelevant collection entirely
    const skipSubscriptions = type === "recipe_purchase";
    const skipPurchases = type === "subscription";

    // ── Subscription filter ───────────────────────────────────────────────────
    const subscriptionFilter = {};
    if (status) subscriptionFilter.status = status;
    if (from || to) {
      subscriptionFilter.createdAt = {};
      if (from) subscriptionFilter.createdAt.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        subscriptionFilter.createdAt.$lte = toDate;
      }
    }

    // ── Purchase filter ───────────────────────────────────────────────────────
    const purchaseFilter = {};
    if (status) purchaseFilter.status = status;
    if (from || to) {
      purchaseFilter.createdAt = {};
      if (from) purchaseFilter.createdAt.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        purchaseFilter.createdAt.$lte = toDate;
      }
    }

    // ── Subscription pipeline (lookup user) ───────────────────────────────────
    const subscriptionPipeline = [
      { $match: subscriptionFilter },
      {
        $lookup: {
          from: "user",
          localField: "userId",
          foreignField: "_id",
          as: "user",
          pipeline: [{ $project: { name: 1, email: 1, image: 1 } }],
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          type: { $literal: "subscription" },
          amount: 1,
          status: 1,
          createdAt: 1,
          userId: 1,
          userName: "$user.name",
          userEmail: "$user.email",
          userImage: "$user.image",
          recipeName: { $literal: null },
          recipeId: { $literal: null },
        },
      },
    ];

    // ── Purchase pipeline (lookup user + recipe) ──────────────────────────────
    const purchasePipeline = [
      { $match: purchaseFilter },
      {
        $lookup: {
          from: "user",
          localField: "userId",
          foreignField: "_id",
          as: "user",
          pipeline: [{ $project: { name: 1, email: 1, image: 1 } }],
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "recipes",
          localField: "recipeId",
          foreignField: "_id",
          as: "recipe",
          pipeline: [{ $project: { recipeName: 1 } }],
        },
      },
      { $unwind: { path: "$recipe", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          type: { $literal: "recipe_purchase" },
          amount: 1,
          status: 1,
          createdAt: 1,
          userId: 1,
          userName: "$user.name",
          userEmail: "$user.email",
          userImage: "$user.image",
          recipeName: "$recipe.recipeName",
          recipeId: "$recipe._id",
        },
      },
    ];

    // ── Fetch ─────────────────────────────────────────────────────────────────
    const [rawSubscriptions, rawPurchases] = await Promise.all([
      skipSubscriptions
        ? Promise.resolve([])
        : subscriptionsCollection.aggregate(subscriptionPipeline).toArray(),
      skipPurchases
        ? Promise.resolve([])
        : purchasesCollection.aggregate(purchasePipeline).toArray(),
    ]);

    // ── Merge + text search ───────────────────────────────────────────────────
    let merged = [...rawSubscriptions, ...rawPurchases];

    if (q?.trim()) {
      const regex = new RegExp(q.trim(), "i");
      merged = merged.filter(
        (tx) =>
          regex.test(tx.userName) ||
          regex.test(tx.userEmail) ||
          String(tx._id) === q.trim(),
      );
    }

    // ── Sort + paginate in memory ─────────────────────────────────────────────
    merged.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = merged.length;
    const transactions = merged.slice(skip, skip + pageSize);

    res.json({
      transactions,
      total,
      totalPages: Math.ceil(total / pageSize) || 1,
      page: pageNum,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching transactions!" });
  }
};

// Get transaction stats
const getTransactionStats = async (req, res) => {
  try {
    const [revenueResult, subscriptionCount, recipePurchaseCount] =
      await Promise.all([
        Promise.all([
          subscriptionsCollection
            .aggregate([
              { $match: { status: "active" } }, // subscriptions use "active"
              { $group: { _id: null, total: { $sum: "$amount" } } },
            ])
            .toArray(),
          purchasesCollection
            .aggregate([
              { $match: { status: "completed" } },
              { $group: { _id: null, total: { $sum: "$amount" } } },
            ])
            .toArray(),
        ]),
        subscriptionsCollection.countDocuments(),
        purchasesCollection.countDocuments(),
      ]);

    const [subRevenue, purchaseRevenue] = revenueResult;
    const totalRevenue =
      (subRevenue[0]?.total ?? 0) + (purchaseRevenue[0]?.total ?? 0);

    res.json({ totalRevenue, subscriptionCount, recipePurchaseCount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching transaction stats!" });
  }
};

module.exports = { getTransactions, getTransactionStats };
