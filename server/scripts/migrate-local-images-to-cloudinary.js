require("dotenv").config();

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const { v2: cloudinary } = require("cloudinary");

const Product = require("../models/Product");
const Feature = require("../models/Feature");
const Order = require("../models/Order");

const uploadsDirectory = path.join(__dirname, "..", "uploads");
const migrationFolder = process.env.CLOUDINARY_FOLDER || "smartbuy";

function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

function extractUploadsPath(imageUrl) {
  if (!imageUrl || typeof imageUrl !== "string") {
    return "";
  }

  const trimmedImageUrl = imageUrl.trim();
  const uploadsIndex = trimmedImageUrl.indexOf("/uploads/");

  if (uploadsIndex === -1) {
    return "";
  }

  return trimmedImageUrl.slice(uploadsIndex);
}

function resolveLocalFilePath(imageUrl) {
  const uploadsPath = extractUploadsPath(imageUrl);

  if (!uploadsPath) {
    return "";
  }

  return path.join(uploadsDirectory, path.basename(uploadsPath));
}

async function uploadLocalFileToCloudinary(localFilePath) {
  return cloudinary.uploader.upload(localFilePath, {
    folder: `${migrationFolder}/migrated`,
    resource_type: "image",
    use_filename: true,
    unique_filename: true,
  });
}

async function migrateProducts(imageCache, summary) {
  const products = await Product.find({
    image: { $regex: "/uploads/" },
  });

  for (const product of products) {
    const localFilePath = resolveLocalFilePath(product.image);

    if (!localFilePath || !fs.existsSync(localFilePath)) {
      summary.missingFiles.push({
        type: "product",
        id: product._id.toString(),
        image: product.image,
      });
      continue;
    }

    if (!imageCache.has(localFilePath)) {
      const result = await uploadLocalFileToCloudinary(localFilePath);
      imageCache.set(localFilePath, result.secure_url);
      summary.uploadedFiles.push(localFilePath);
    }

    product.image = imageCache.get(localFilePath);
    await product.save();
    summary.updatedProducts += 1;
  }
}

async function migrateFeatures(imageCache, summary) {
  const features = await Feature.find({
    image: { $regex: "/uploads/" },
  });

  for (const feature of features) {
    const localFilePath = resolveLocalFilePath(feature.image);

    if (!localFilePath || !fs.existsSync(localFilePath)) {
      summary.missingFiles.push({
        type: "feature",
        id: feature._id.toString(),
        image: feature.image,
      });
      continue;
    }

    if (!imageCache.has(localFilePath)) {
      const result = await uploadLocalFileToCloudinary(localFilePath);
      imageCache.set(localFilePath, result.secure_url);
      summary.uploadedFiles.push(localFilePath);
    }

    feature.image = imageCache.get(localFilePath);
    await feature.save();
    summary.updatedFeatures += 1;
  }
}

async function migrateOrders(imageCache, summary) {
  const orders = await Order.find({
    "cartItems.image": { $regex: "/uploads/" },
  });

  for (const order of orders) {
    let orderChanged = false;

    for (const cartItem of order.cartItems) {
      if (!cartItem?.image || !cartItem.image.includes("/uploads/")) {
        continue;
      }

      const localFilePath = resolveLocalFilePath(cartItem.image);

      if (!localFilePath || !fs.existsSync(localFilePath)) {
        summary.missingFiles.push({
          type: "order",
          id: order._id.toString(),
          image: cartItem.image,
        });
        continue;
      }

      if (!imageCache.has(localFilePath)) {
        const result = await uploadLocalFileToCloudinary(localFilePath);
        imageCache.set(localFilePath, result.secure_url);
        summary.uploadedFiles.push(localFilePath);
      }

      cartItem.image = imageCache.get(localFilePath);
      orderChanged = true;
      summary.updatedOrderItems += 1;
    }

    if (orderChanged) {
      await order.save();
      summary.updatedOrders += 1;
    }
  }
}

async function main() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing in server/.env");
  }

  if (!isCloudinaryConfigured()) {
    throw new Error(
      "Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to server/.env"
    );
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  await mongoose.connect(process.env.MONGO_URI);

  const imageCache = new Map();
  const summary = {
    updatedProducts: 0,
    updatedFeatures: 0,
    updatedOrders: 0,
    updatedOrderItems: 0,
    uploadedFiles: [],
    missingFiles: [],
  };

  try {
    await migrateProducts(imageCache, summary);
    await migrateFeatures(imageCache, summary);
    await migrateOrders(imageCache, summary);

    console.log(
      JSON.stringify(
        {
          database: mongoose.connection.name,
          updatedProducts: summary.updatedProducts,
          updatedFeatures: summary.updatedFeatures,
          updatedOrders: summary.updatedOrders,
          updatedOrderItems: summary.updatedOrderItems,
          uploadedFileCount: new Set(summary.uploadedFiles).size,
          missingFiles: summary.missingFiles,
        },
        null,
        2
      )
    );
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
