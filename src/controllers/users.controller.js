const express = require("express");
const router = express.Router();
const { database } = require("../config/db");
const { ObjectId } = require("mongodb");

const usersCollection = database.collection("user");

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

module.exports = { updateUser, getTotalUsers, getTotalPremiumMembers };
