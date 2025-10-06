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
    month: "short", // Changed from "long" to "short"
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Formats a date string for reading page (always long format)
 * @param {string} dateStr - The date string to format
 * @returns {string} Formatted date with long month
 */
export function formatDateReading(dateStr) {
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

/**
 * Calculates estimated reading time based on word count
 * @param {string} content - Article content (HTML string)
 * @returns {string} Reading time (e.g., "3 min read")
 */
export function calculateReadingTime(content) {
  if (!content) return "1 min read";

  // Strip HTML tags and count words
  const textContent = content.replace(/<[^>]*>/g, "");
  const wordCount = textContent.trim().split(/\s+/).length;

  // Average reading speed: 225 words per minute
  const readingTime = Math.ceil(wordCount / 225);

  return `${readingTime} min read`;
}

/**
 * Extracts alt text from image filename
 * @param {string} imagePath - The image path/filename
 * @returns {string} Alt text for the image
 */
export function extractAltFromFilename(imagePath) {
  // Get just the filename without path and extension
  const filename = imagePath.split("/").pop().split(".")[0];

  // Split on first underscore to separate ID from description
  const parts = filename.split("_");

  // If no underscore, return filename as-is
  if (parts.length === 1) return filename;

  // Take everything after first underscore, replace _ with spaces
  return parts.slice(1).join(" ");
}

export function createImageLoader() {
  return new Promise((resolve) => {
    const loaderHTML = `
<div class="pyramid-loader">
        <div class="pyramid-dot"></div>
        <div class="pyramid-line pyramid-line-1"></div>
        <div class="pyramid-line pyramid-line-2"></div>
        <div class="pyramid-line pyramid-line-3"></div>
        <div class="pyramid-line pyramid-line-4"></div>
      </div>
    `;
    resolve(loaderHTML);
  });
}
