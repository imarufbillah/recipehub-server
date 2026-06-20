const express = require("express");
const router = express.Router();

const { addToFavorites } = require("../controllers/favorites.controller");

router.post("/", addToFavorites);

module.exports = router;
