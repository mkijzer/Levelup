// ============================================================================
// categoryManager.js - CATEGORY PAGE MANAGEMENT
// ============================================================================
// Description: Handles category page display, load more functionality
// Version: 1.0 - Split from data.js for better organization
// ============================================================================

import { articlesData, CONFIG } from "./articleLoader.js";
import { createArticleCard } from "./articleCards.js";
import { normalizeCategory } from "./utils.js";

// ============================================================================
// Load More Functionality
// ============================================================================

/**
 * Loads more articles for category page
 */
async function loadMoreCategoryArticles() {
  const categoryPageView = document.getElementById("category-page-view");
  const categoryTitle = categoryPageView.querySelector(".category-page-title");
  const listContainer = categoryPageView.querySelector(
    ".category-articles-list"
  );
  const loadMoreButton = categoryPageView.querySelector(".load-more-button");

  if (!categoryTitle || !listContainer || !loadMoreButton) {
    console.error("CategoryManager: Required elements not found");
    return;
  }

  const categoryName = categoryTitle.textContent.toLowerCase();
  const currentCount = listContainer.children.length + 3; // +3 for hero articles

  const allCategoryArticles = articlesData.filter(
    (article) => normalizeCategory(article.category || "") === categoryName
  );

  const moreArticles = allCategoryArticles.slice(
    currentCount,
    currentCount + CONFIG.LOAD_MORE_BATCH_SIZE
  );

  for (const article of moreArticles) {
    const card = await createArticleCard(article, "small");
    listContainer.appendChild(card);
  }

  if (moreArticles.length < CONFIG.LOAD_MORE_BATCH_SIZE) {
    showEndOfArticlesMessage(loadMoreButton);
  }
}

/**
 * Shows end of articles message on load more button
 */
function showEndOfArticlesMessage(loadMoreButton) {
  loadMoreButton.textContent =
    "You've read the last article! Why not try to level up in another category?";
  loadMoreButton.classList.add("load-more-disabled");

  loadMoreButton.removeEventListener("click", loadMoreCategoryArticles);
}

/**
 * Resets load more button to default state
 */
function resetLoadMoreButton(loadMoreButton) {
  if (loadMoreButton) {
    loadMoreButton.textContent = "Load More";
    loadMoreButton.classList.remove("load-more-disabled");
    loadMoreButton.classList.remove("hidden-element");
  }
}

/**
 * Sets up category page interactions (load more button)
 */
function setupCategoryPageInteractions() {
  const loadMoreButton = document.querySelector(".load-more-button");

  if (loadMoreButton) {
    loadMoreButton.removeEventListener("click", loadMoreCategoryArticles);
    loadMoreButton.addEventListener("click", loadMoreCategoryArticles);
  }
}

// ============================================================================
// Export Functions
// ============================================================================
export {
  loadMoreCategoryArticles,
  resetLoadMoreButton,
  setupCategoryPageInteractions,
};
