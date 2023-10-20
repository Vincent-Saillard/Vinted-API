const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

// Création du serveur
const app = express();
app.use(express.json());
app.use(cors());

// connexion à la db
mongoose.connect(process.env.MONGODB_URI);
// import des routes
const userRoutes = require("./routes/user");
const offerRoutes = require("./routes/offer");
app.use(userRoutes);
app.use(offerRoutes);

app.all("*", (req, res) => {
  res.status(404).json({ message: "This route does not exist" });
});

// Démarrage du serveur
app.listen(process.env.PORT, () => {
  console.log("Server started");
});
