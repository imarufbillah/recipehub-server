const express = require("express");
const router = express.Router();
const { database } = require("../config/db");
const { ObjectId } = require("mongodb");

const reportsCollection = database.collection("reports");
const recipesCollection = database.collection("recipes");
const usersCollection = database.collection("user");

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

// Review a report
const reviewReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { action } = req.body;

    if (!["resolve", "dismiss"].includes(action)) {
      return res.status(400).json({ message: "Invalid action!" });
    }

    const report = await reportsCollection.findOne(
      { _id: new ObjectId(reportId) },
      { projection: { recipeId: 1, status: 1 } },
    );

    if (!report) {
      return res.status(404).json({ message: "Report not found!" });
    }

    if (report.status !== "pending") {
      return res.status(400).json({ message: "Report already reviewed!" });
    }

    const newStatus = action === "resolve" ? "resolved" : "dismissed";

    const operations = [
      reportsCollection.updateOne(
        { _id: new ObjectId(reportId) },
        { $set: { status: newStatus, reviewedAt: new Date() } },
      ),
    ];

    if (action === "resolve") {
      const recipe = await recipesCollection.findOne(
        { _id: report.recipeId },
        { projection: { userId: 1 } },
      );

      operations.push(recipesCollection.deleteOne({ _id: report.recipeId }));

      if (recipe?.userId) {
        operations.push(
          usersCollection.updateOne(
            { _id: recipe.userId },
            { $inc: { recipes: -1 } },
          ),
        );
      }
    }

    await Promise.all(operations);

    res.json({ message: `Report ${newStatus} successfully!` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error reviewing report!" });
  }
};

module.exports = {
  createReport,
  getReportStatus,
  getTotalReports,
  getAllReports,
  reviewReport,
};
