// ============================================================================
// mostRead.js - MOST READ SECTION MANAGEMENT
// ============================================================================
// Description: Handles Most Read section population for desktop
// Version: 1.0 - Desktop only implementation
// ============================================================================

import { articlesData } from "./articleLoader.js";
import { formatDate, calculateReadingTime } from "./utils.js";

// ============================================================================
// Most Read Management
// ============================================================================

/**
 * Populates the Most Read section with 5 random published articles
 */
export function populateMostRead() {
  const mostReadGrid = document.querySelector(".most-read-grid");
  if (!mostReadGrid || articlesData.length === 0) {
    return;
  }

  // Get 5 random articles from published articles
  const shuffled = [...articlesData].sort(() => Math.random() - 0.5);
  const selectedArticles = shuffled.slice(0, 5);

  const mostReadCards = mostReadGrid.querySelectorAll(".most-read-card");

  selectedArticles.forEach((article, index) => {
    if (mostReadCards[index]) {
      populateMostReadCard(mostReadCards[index], article);
    }
  });
}

/**
 * Populates a single Most Read card
 */
function populateMostReadCard(card, article) {
  const title = card.querySelector(".most-read-title");
  const meta = card.querySelector(".most-read-meta");
  const image = card.querySelector(".most-read-image");

  if (title) {
    title.textContent = article.title || "Untitled Article";
  }

  if (meta) {
    const readingTime = calculateReadingTime(article.content);
    meta.textContent = `${formatDate(article.date)} | ${readingTime}`;
  }

  if (image) {
    // Use inline_image if available, fallback to main image
    const imageUrl =
      article.inline_image ||
      article.image ||
      "assets/images/fallback_image.png";
    image.src = imageUrl;
    image.alt = article.title || "Article image";
  }

  // Set article ID for click handling
  card.setAttribute("data-article-id", article.id);
}

/**
 * Weekly rotation - call this to refresh the selection
 */
export function refreshMostRead() {
  populateMostRead();
}
