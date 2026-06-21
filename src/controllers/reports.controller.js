const express = require("express");
const router = express.Router();
const { database } = require("../config/db");
const { ObjectId } = require("mongodb");

const reportsCollection = database.collection("reports");

// Create a report
const createReport = async (req, res) => {
  try {
    const { userId, recipeId, reason } = req.body;
    const newReport = {
      userId: new ObjectId(userId),
      recipeId: new ObjectId(recipeId),
      reason,
      status: "pending",
      createdAt: new Date(),
    };

    await reportsCollection.insertOne(newReport);
    res.json({ message: "Report created successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating report!" });
  }
};

module.exports = {
  createReport,
};
