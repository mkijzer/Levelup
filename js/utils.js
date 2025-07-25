// ============================================================================
// utils.js
// ============================================================================
// Description: Utility functions for string normalization, date formatting, and image preloading.
// Version: 1.0
// Author: [Mike]
// ============================================================================

/**
 * Normalizes a category string to lowercase and trimmed format.
 * @param {string} category - The category to normalize
 * @returns {string} Normalized category
 */
export function normalizeCategory(category) {
  return category.toLowerCase().trim();
}

/**
 * Formats a date string into a readable format (e.g., "Jan 1, 2023").
 * @param {string} dateStr - The date string to format
 * @returns {string} Formatted date
 */
export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Preloads an image and provides a fallback on error.
 * @param {string} url - The image URL to preload
 * @returns {Promise<string>} Resolved URL or fallback image path
 */
export function preloadImage(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = url;
    img.onload = () => resolve(url);
    img.onerror = () => resolve("assets/images/fallback_image.png");
  });
}
