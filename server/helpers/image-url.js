function normalizeStoredImageUrl(imageUrl) {
  if (!imageUrl || typeof imageUrl !== "string") {
    return "";
  }

  const trimmedImageUrl = imageUrl.trim();

  if (trimmedImageUrl.startsWith("/uploads/")) {
    return trimmedImageUrl;
  }

  if (trimmedImageUrl.includes("/uploads/")) {
    const uploadsPathIndex = trimmedImageUrl.indexOf("/uploads/");
    return trimmedImageUrl.slice(uploadsPathIndex);
  }

  return trimmedImageUrl.includes("res.cloudinary.com")
    ? trimmedImageUrl.replace(/^http:\/\//i, "https://")
    : trimmedImageUrl;
}

module.exports = { normalizeStoredImageUrl };
