const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");

const uploadsDirectory = path.join(__dirname, "..", "uploads");
fs.mkdirSync(uploadsDirectory, { recursive: true });

const storage = multer.memoryStorage();

const upload = multer({ storage });

const cloudinaryConfig = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
};

const isCloudinaryConfigured = Object.values(cloudinaryConfig).every(Boolean);

if (isCloudinaryConfigured) {
  cloudinary.config(cloudinaryConfig);
}

function getFileExtension(file) {
  const originalExtension = path.extname(file?.originalname || "");

  if (originalExtension) {
    return originalExtension;
  }

  if (file?.mimetype === "image/png") {
    return ".png";
  }

  if (file?.mimetype === "image/jpeg") {
    return ".jpg";
  }

  if (file?.mimetype === "image/webp") {
    return ".webp";
  }

  if (file?.mimetype === "image/avif") {
    return ".avif";
  }

  return "";
}

function saveFileLocally(file) {
  if (!file?.buffer) {
    throw new Error("No uploaded file buffer available");
  }

  const uniqueFileName = `${Date.now()}-${Math.round(
    Math.random() * 1e9
  )}${getFileExtension(file)}`;
  const outputPath = path.join(uploadsDirectory, uniqueFileName);

  fs.writeFileSync(outputPath, file.buffer);

  const imageUrl = `/uploads/${uniqueFileName}`;

  return {
    secure_url: imageUrl,
    url: imageUrl,
  };
}

function uploadToCloudinary(file) {
  if (!file?.buffer) {
    throw new Error("No uploaded file buffer available");
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: process.env.CLOUDINARY_FOLDER || "smartbuy",
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result);
      }
    );

    uploadStream.end(file.buffer);
  });
}

async function imageUploadUtil(file) {
  if (isCloudinaryConfigured) {
    return uploadToCloudinary(file);
  }

  return saveFileLocally(file);
}

module.exports = {
  upload,
  imageUploadUtil,
  isCloudinaryConfigured,
};
