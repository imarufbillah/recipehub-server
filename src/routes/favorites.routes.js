const express = require("express");
const router = express.Router();

const {
  addToFavorites,
  removeFromFavorites,
  getFavoriteStatus,
  getFavoritesByUserId,
} = require("../controllers/favorites.controller");

const { verifyToken } = require("../middlewares/verifyToken");

router.post("/", verifyToken, addToFavorites);
router.delete("/", verifyToken, removeFromFavorites);
router.get("/status", verifyToken, getFavoriteStatus);
router.get("/user/:userId", verifyToken, getFavoritesByUserId);

module.exports = router;
