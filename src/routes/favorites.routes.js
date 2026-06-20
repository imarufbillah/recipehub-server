const express = require("express");
const router = express.Router();

const {
  addToFavorites,
  removeFromFavorites,
  getFavoriteStatus,
} = require("../controllers/favorites.controller");

router.post("/", addToFavorites);
router.delete("/", removeFromFavorites);
router.get("/status", getFavoriteStatus);

module.exports = router;
