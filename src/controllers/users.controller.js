const express = require("express");
const router = express.Router();
const { database } = require("../config/db");
const { ObjectId } = require("mongodb");

const usersCollection = database.collection("user");
const recipesCollection = database.collection("recipes");
const favoritesCollection = database.collection("favorites");
const likesCollection = database.collection("likes");
const subscriptionsCollection = database.collection("subscriptions");
const reportsCollection = database.collection("reports");
const purchasesCollection = database.collection("purchases");

// Update a user
const updateUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const payload = req.body;

    if (userId !== req.user?.id) {
      return res.status(401).json({ message: "Unauthorized!" });
    }

    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { ...payload, updatedAt: new Date() } },
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "User not found!" });
    }

    res.json({ message: "User updated successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating user!" });
  }
};

// Get total users
const getTotalUsers = async (req, res) => {
  try {
    const total = await usersCollection.countDocuments();
    res.json({ totalUsers: total });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching total users!" });
  }
};

// Get total premium members
const getTotalPremiumMembers = async (req, res) => {
  try {
    const total = await usersCollection.countDocuments({ plan: "premium" });
    res.json({ totalPremiumMembers: total });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching total premium members!" });
  }
};

// Block a user
const blockUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { isBlocked: true, updatedAt: new Date() } },
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "User not found!" });
    }

    res.json({ message: "User blocked successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error blocking user!" });
  }
};

// Unblock a user
const unblockUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { isBlocked: false, updatedAt: new Date() } },
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "User not found!" });
    }

    res.json({ message: "User unblocked successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error unblocking user!" });
  }
};

// Delete a user
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const userObjectId = new ObjectId(userId);

    const result = await usersCollection.deleteOne({ _id: userObjectId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "User not found!" });
    }

    // Cleanup orphaned data
    await Promise.all([
      recipesCollection.deleteMany({ userId: userObjectId }),
      favoritesCollection.deleteMany({ userId: userObjectId }),
      likesCollection.deleteMany({ userId: userObjectId }),
      purchasesCollection.deleteMany({ userId: userObjectId }),
      reportsCollection.deleteMany({ userId: userObjectId }),
      subscriptionsCollection.deleteMany({ userId: userObjectId }),
    ]);

    res.json({ message: "User deleted successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting user!" });
  }
};

module.exports = {
  updateUser,
  getTotalUsers,
  getTotalPremiumMembers,
  blockUser,
  unblockUser,
  deleteUser,
};
