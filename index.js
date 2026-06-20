const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const port = process.env.PORT;

app.use(cors());
app.use(express.json());

// Routes imports
const recipesRoutes = require("./src/routes/recipes.routes");
const likesRoutes = require("./src/routes/likes.routes");
const favoritesRoutes = require("./src/routes/favorites.routes");

// Routes
app.use("/recipes", recipesRoutes);
app.use("/likes", likesRoutes);
app.use("/favorites", favoritesRoutes);

app.get("/", (req, res) => {
  res.send("Server is cooking!");
});

app.listen(port, () => {
  console.log(`Server is cooking on port ${port}`);
});
