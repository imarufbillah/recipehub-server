const express = require("express");
const router = express.Router();

const {
  addToFavorites,
  removeFromFavorites,
} = require("../controllers/favorites.controller");

router.post("/", addToFavorites);
router.delete("/", removeFromFavorites);

module.exports = router;
