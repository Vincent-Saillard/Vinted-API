const express = require("express");
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const cloudinary = require("cloudinary").v2;
const router = express.Router();

// Import du modèle
const User = require("../models/User");
const fileUpload = require("express-fileupload");

// Connexion au compte cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
  secure: true,
});

// fonction pour transformer les fichiers images pour envoi vers cloudinary
const convertToBase64 = (file) => {
  return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
};

// Création d'un nouvel utilisateur
router.post("/user/signup", fileUpload(), async (req, res) => {
  try {
    // vérifie si l'email existe déjà ou non
    const existingUser = await User.find({ email: req.body.email });
    if (existingUser.length > 0) {
      res.status(400).json({ message: "This email already exists" });
    } else {
      // import de l'image de profile sur cloudinary
      const transformedPic = convertToBase64(req.files.picture);
      const profilePic = await cloudinary.uploader.upload(transformedPic);
      const newProfilePic = await cloudinary.uploader.rename(
        profilePic.public_id,
        `vinted/profile/${profilePic.public_id}`
      );
      const newSalt = uid2(16);
      const newToken = uid2(64);
      const newHash = SHA256(req.body.password + newSalt).toString(encBase64);
      const newUser = new User({
        email: req.body.email,
        account: {
          username: req.body.username,
          avatar: {
            name: "profile_picture",
            secure_url: newProfilePic.secure_url,
          },
        },
        newsletter: req.body.newsletter,
        token: newToken,
        hash: newHash,
        salt: newSalt,
      });
      await newUser.save();
      res.status(200).json({
        _Id: newUser.id,
        token: newUser.token,
        account: {
          username: newUser.account.username,
          avatar: { secure_url: newUser.account.avatar.secure_url },
        },
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Connexion de l'utilisateur à son espace
router.post("/user/login", async (req, res) => {
  try {
    const searchingUser = await User.find({ email: req.body.email });
    // l'email n'existe pas dans la db
    if (searchingUser.length === 0) {
      res
        .status(400)
        .json({ message: "This email does not exist, please sign-up first" });
    } else {
      const givenPassword = req.body.password;
      const savedSalt = searchingUser[0].salt;
      const savedHash = searchingUser[0].hash;
      if (savedHash !== SHA256(givenPassword + savedSalt).toString(encBase64)) {
        res.status(400).json({ message: "Wrong password" });
      } else {
        res.status(200).json({
          _id: searchingUser[0].id,
          token: searchingUser[0].token,
          account: {
            username: searchingUser[0].account.username,
          },
        });
      }
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
