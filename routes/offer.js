const express = require("express");
const router = express.Router();
const cloudinary = require("cloudinary").v2;
const fileUpload = require("express-fileupload");

// Import du modèle
const Offer = require("../models/Offer");

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

// fonction de vérification d'authentification du client
const isAuthenticated = require("../middlewares/isAuthenticated");

// Création de la route permettant d'ajourt une offre, les informations envoyées sont de type POST et l'on doit vérifier le token via les headers par la fonction isAuthenticated
router.post("/offers", fileUpload(), isAuthenticated, async (req, res) => {
  try {
    // récupération des données du body en destructuring
    const { title, description, price, condition, city, brand, size, color } =
      req.body;
    // Envoi de l'image à cloudinary
    const transformedPic = convertToBase64(req.files.picture);
    const result = await cloudinary.uploader.upload(transformedPic);
    // ajout de l'offre dans la base de données
    const newOffer = new Offer({
      product_name: title,
      product_description: description,
      product_price: price,
      product_details: {
        ETAT: condition,
        EMPLACEMENT: city,
        MARQUE: brand,
        TAILLE: size,
        COULEUR: color,
      },
      product_image: {
        public_id: result.public_id,
        secure_url: result.secure_url,
      },
      owner: req.user,
    });
    // console.log(newOffer);
    // mise à jour du nom et chemin d'accès de la photo avec l'id de l'objet de base de données
    newResult = await cloudinary.uploader.rename(
      result.public_id,
      `vinted/offers/${newOffer._id}`
    );
    // Mise à jour des info de l'image après modif du nom et chemin d'accès
    newOffer.product_image.public_id = newResult.public_id;
    newOffer.product_image.secure_url = newResult.secure_url;
    await newOffer.save();
    res.status(200).json(newOffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//Route pour permettre à l'user de modifier son annonce
router.put("/offers/:id", fileUpload(), isAuthenticated, async (req, res) => {
  try {
    const OfferToUpdate = await Offer.findById(req.params.id);
    // console.log(OfferToUpdate);
    // console.log(req.files);
    const { title, description, price, condition, city, brand, size, color } =
      req.body;
    OfferToUpdate.product_name = title;
    OfferToUpdate.product_description = description;
    OfferToUpdate.product_price = price;
    OfferToUpdate.product_details.ETAT = condition;
    OfferToUpdate.product_details.EMPLACEMENT = city;
    OfferToUpdate.product_details.MARQUE = brand;
    OfferToUpdate.product_details.TAILLE = size;
    OfferToUpdate.product_details.COULEUR = color;
    // si il y a modification de l'image
    if (req.files) {
      // Envoi de l'image à cloudinary
      const transformedPic = convertToBase64(req.files.picture);
      const result = await cloudinary.uploader.upload(transformedPic);
      await cloudinary.uploader.destroy(OfferToUpdate.product_image.public_id);
      const newResult = await cloudinary.uploader.rename(
        result.public_id,
        `vinted/offers/${OfferToUpdate._id}`
      );
      OfferToUpdate.product_image.public_id = newResult.public_id;
      OfferToUpdate.product_image.secure_url = newResult.secure_url;
    }
    await OfferToUpdate.save();
    res.status(200).json(OfferToUpdate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Route pour permettre à l'user de supprimer une offre
router.delete("/offers/:id", isAuthenticated, async (req, res) => {
  try {
    const offerToDelete = await Offer.findById(req.params.id);
    await cloudinary.uploader.destroy(offerToDelete.product_image.public_id);
    await Offer.findByIdAndDelete(req.params.id);
    res
      .status(200)
      .json({ message: "Your offer has been successfully deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Route pour visualiser les articles en fonction de filtres passés en query
router.get("/offers", async (req, res) => {
  try {
    let { title, priceMin, priceMax, sort, page, quantityByPage } = req.query;
    // détermination de l'affichage (nombre d'articles par pages et nombre de pages)
    // si la quantité par pages n'est pas précisé on va limiter à 3 resultats par pages
    // si le numéro de la page n'est pas précisé on afficher la première page
    if (!quantityByPage) {
      quantityByPage = 3;
    }
    if (!page) {
      page = 1;
    }
    if (!title) {
      title = "";
    }
    if (!priceMin) {
      priceMin = 0;
    }
    if (!priceMax) {
      priceMax = 500;
    }
    const limitValue = quantityByPage;
    const skipValue = (page - 1) * limitValue;
    // console.log(
    //   title,
    //   priceMin,
    //   priceMax,
    //   sort,
    //   page,
    //   quantityByPage,
    //   skipValue
    // );
    if (sort) {
      if (sort === "price-desc") {
        const totaloffers = await Offer.find({
          product_name: new RegExp(title, "i"),
          product_price: { $gte: priceMin, $lte: priceMax },
        });
        const offers = await Offer.find({
          product_name: new RegExp(title, "i"),
          product_price: { $gte: priceMin, $lte: priceMax },
        })
          .populate("owner", "account _id")
          .skip(skipValue)
          .limit(quantityByPage)
          .sort({ product_price: "desc" });
        res.status(200).json({
          count: totaloffers.length,
          offers: offers,
        });
      } else if (sort === "price-asc") {
        const totaloffers = await Offer.find({
          product_name: new RegExp(title, "i"),
          product_price: { $gte: priceMin, $lte: priceMax },
        });
        const offers = await Offer.find({
          product_name: new RegExp(title, "i"),
          product_price: { $gte: priceMin, $lte: priceMax },
        })
          .populate("owner", "account _id")
          .skip(skipValue)
          .limit(quantityByPage)
          .sort({ product_price: "asc" });
        res.status(200).json({
          count: totaloffers.length,
          offers: offers,
        });
      } else {
        res.status(400).json({ message: "Wrong parameter to sort offers" });
      }
    } else {
      const totaloffers = await Offer.find({
        product_name: new RegExp(title, "i"),
        product_price: { $gte: priceMin, $lte: priceMax },
      });
      const offers = await Offer.find({
        product_name: new RegExp(title, "i"),
        product_price: { $gte: priceMin, $lte: priceMax },
      })
        .skip(skipValue)
        .limit(quantityByPage)
        .populate("owner", "account _id");

      res.status(200).json({
        count: totaloffers.length,
        offers: offers,
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Route pour récupérer une annonce avec son id
router.get("/offers/:id", async (req, res) => {
  try {
    const specificOffer = await Offer.findById(req.params.id).populate(
      "owner",
      "account _id"
    );
    res.status(200).json(specificOffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
