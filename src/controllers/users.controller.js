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

    const updates = {
      ...payload,
      updatedAt: new Date(),
    };

    const cursor = { _id: new ObjectId(userId) };

    const result = await usersCollection.updateOne(cursor, {
      $set: updates,
    });

    if (result.modifiedCount > 0) {
      res.json({ message: "User updated successfully!" });
    } else {
      res.status(404).json({ message: "User not found!" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating user!" });
  }
};

module.exports = { updateUser };
