const express = require("express");
const router = express.Router();

const {
  addToFavorites,
  removeFromFavorites,
  getFavoriteStatus,
  getFavoritesByUserId,
} = require("../controllers/favorites.controller");

router.post("/", addToFavorites);
router.delete("/", removeFromFavorites);
router.get("/status", getFavoriteStatus);
router.get("/user/:userId", getFavoritesByUserId);

module.exports = router;
