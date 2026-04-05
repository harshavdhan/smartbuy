export function getNormalizedSizes(sizeValue) {
  if (Array.isArray(sizeValue)) {
    return [...new Set(sizeValue.map((size) => String(size).trim()).filter(Boolean))];
  }

  if (typeof sizeValue !== "string") {
    return [];
  }

  return [...new Set(sizeValue.split(",").map((size) => size.trim()).filter(Boolean))];
}

export function formatSizesForInput(sizeValue) {
  return getNormalizedSizes(sizeValue).join(", ");
}
