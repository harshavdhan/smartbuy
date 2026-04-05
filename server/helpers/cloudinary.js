const fs = require("fs");
const multer = require("multer");
const path = require("path");

const uploadsDirectory = path.join(__dirname, "..", "uploads");
fs.mkdirSync(uploadsDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDirectory);
  },
  filename: (req, file, cb) => {
    const fileExtension = path.extname(file.originalname || "");
    const uniqueFileName = `${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}${fileExtension}`;

    cb(null, uniqueFileName);
  },
});

async function imageUploadUtil(file) {
  if (!file?.filename) {
    throw new Error("No uploaded file available");
  }

  const imageUrl = `/uploads/${file.filename}`;

  return {
    secure_url: imageUrl,
    url: imageUrl,
  };
}

const upload = multer({ storage });

module.exports = { upload, imageUploadUtil };
