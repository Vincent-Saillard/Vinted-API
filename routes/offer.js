const express = require("express");
const router = express.Router();
const cloudinary = require("cloudinary").v2;
const fileUpload = require("express-fileupload");

// Import model
const Offer = require("../models/Offer");

// connexion to cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
  secure: true,
});

// function to transform pic files so they can be red by cloudinary
const convertToBase64 = (file) => {
  return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
};

// function to autentify client
const isAuthenticated = require("../middlewares/isAuthenticated");

// Route to create offer, checking user token in middleware
router.post("/offers", fileUpload(), isAuthenticated, async (req, res) => {
  try {
    const { title, description, price, condition, city, brand, size, color } =
      req.body;
    // Send to cloudinary
    const transformedPic = convertToBase64(req.files.picture);
    const result = await cloudinary.uploader.upload(transformedPic);
    // add offer to db
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
    // update access with folder name
    const newResult = await cloudinary.uploader.rename(
      result.public_id,
      `vinted/offers/${newOffer._id}`
    );
    // updating pic information with folder name
    newOffer.product_image.public_id = newResult.public_id;
    newOffer.product_image.secure_url = newResult.secure_url;
    await newOffer.save();
    res.status(200).json(newOffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// route to modify offer
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
    // if pic is modified
    if (req.files) {
      // Sending new pic to cloudinary
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

// route to delete offer
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

// route to see offers with queries
router.get("/offers", async (req, res) => {
  try {
    let { title, priceMin, priceMax, sort, page, quantityByPage } = req.query;
    // show offers depending on number of pages and number of article by pages
    // if quantity by page is not defined by user limit will be 20
    // if page number is not defined we display first page
    if (!quantityByPage) {
      quantityByPage = 20;
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

// route to find offer with its id
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
