export function getBackendBaseUrl() {
  return import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
}

export function normalizeImageUrl(imageUrl) {
  if (!imageUrl || typeof imageUrl !== "string") {
    return "";
  }

  const trimmedImageUrl = imageUrl.trim();

  if (trimmedImageUrl.startsWith("/")) {
    return `${getBackendBaseUrl()}${trimmedImageUrl}`;
  }

  if (trimmedImageUrl.includes("res.cloudinary.com")) {
    return trimmedImageUrl.replace(/^http:\/\//i, "https://");
  }

  return trimmedImageUrl;
}
