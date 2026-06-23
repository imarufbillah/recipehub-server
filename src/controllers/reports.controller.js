const express = require("express");
const router = express.Router();
const { database } = require("../config/db");
const { ObjectId } = require("mongodb");

const reportsCollection = database.collection("reports");

// Create a report
const createReport = async (req, res) => {
  try {
    const { userId, recipeId, additionalContext = "", ...rest } = req.body;

    if (userId !== req.user?.id) {
      return res.status(401).json({ message: "Unauthorized!" });
    }

    const newReport = {
      userId: new ObjectId(userId),
      recipeId: new ObjectId(recipeId),
      additionalContext,
      ...rest,
      status: "pending",
      createdAt: new Date(),
    };

    const result = await reportsCollection.insertOne(newReport);

    if (!result.acknowledged) {
      return res.status(500).json({ message: "Error creating report!" });
    }

    res.status(201).json({ message: "Report created successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating report!" });
  }
};

// Get report status
const getReportStatus = async (req, res) => {
  try {
    const { userId, recipeId } = req.query;

    if (userId !== req.user?.id) {
      return res.status(401).json({ message: "Unauthorized!" });
    }

    const result = await reportsCollection.findOne(
      {
        userId: new ObjectId(userId),
        recipeId: new ObjectId(recipeId),
      },
      { projection: { _id: 1 } },
    );

    res.json(result !== null);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error checking report status!" });
  }
};

// Get total reports
const getTotalReports = async (req, res) => {
  try {
    const total = await reportsCollection.countDocuments();
    res.json({ totalReports: total });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching total reports!" });
  }
};

// Get all reports
const getAllReports = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page ?? "1", 10));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit ?? "20", 10)),
    );
    const skip = (page - 1) * limit;

    const projection = {
      recipeName: 1,
      reporterName: 1,
      reason: 1,
      createdAt: 1,
      status: 1,
    };

    const [reports, total] = await Promise.all([
      reportsCollection
        .find({}, { projection })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      reportsCollection.countDocuments(),
    ]);

    res.json({ reports, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching reports!" });
  }
};

module.exports = {
  createReport,
  getReportStatus,
  getTotalReports,
  getAllReports,
};
