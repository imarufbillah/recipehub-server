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
const reportsRoutes = require("./src/routes/reports.routes");
const purchasesRoutes = require("./src/routes/purchases.routes");
const usersRoutes = require("./src/routes/users.routes");
const subscriptionsRoutes = require("./src/routes/subscriptions.routes");
const transactionsRoutes = require("./src/routes/transactions.routes");

// Routes
app.use("/recipes", recipesRoutes);
app.use("/likes", likesRoutes);
app.use("/favorites", favoritesRoutes);
app.use("/reports", reportsRoutes);
app.use("/purchases", purchasesRoutes);
app.use("/users", usersRoutes);
app.use("/subscriptions", subscriptionsRoutes);
app.use("/transactions", transactionsRoutes);

app.get("/", (req, res) => {
  res.send("Server is cooking!");
});

app.listen(port, () => {
  console.log(`Server is cooking on port ${port}`);
});
