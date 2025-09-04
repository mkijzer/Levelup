// ============================================================================
// articleLoader.js - ARTICLE LOADING AND DISPLAY
// ============================================================================
// Description: Handles all article loading, card creation, and grid population
// Version: 1.0 - Split from data.js for better organization
// ============================================================================

import {
  normalizeCategory,
  formatDate,
  calculateReadingTime,
  extractAltFromFilename,
  preloadImage,
} from "./utils.js";
import { createArticleCard, populateArticleCard } from "./articleCards.js";

// ============================================================================
// Configuration
// ============================================================================
const CONFIG = {
  CATEGORIES: ["health", "coins", "hack", "ai"],
  ARTICLES_PER_DAY: 3,
  LAUNCH_DATE: new Date("2025-09-01"),
  INITIAL_CATEGORY_ARTICLES: 15,
  LOAD_MORE_BATCH_SIZE: 6,
  CATEGORY_GRID_SIZE: 6,
};

// ============================================================================
// Application State
// ============================================================================
let articlesData = [];
let currentStartIndex = 0;

// ============================================================================
// Data Management Functions
// ============================================================================

/**
 * Gets articles for a specific category with daily rotation logic
 */
function getArticlesByCategory(category) {
  if (category === "latest") {
    return getLatestArticles();
  } else {
    return getCategoryArticlesExcludingLatest(category);
  }
}

/**
 * Gets today's latest articles based on daily rotation
 */
function getLatestArticles() {
  const endIndex = currentStartIndex + CONFIG.ARTICLES_PER_DAY;
  return articlesData.slice(currentStartIndex, endIndex).reverse();
}

/**
 * Gets category articles excluding today's latest
 */
function getCategoryArticlesExcludingLatest(category) {
  const latestArticleIds = new Set(
    articlesData
      .slice(currentStartIndex, currentStartIndex + CONFIG.ARTICLES_PER_DAY)
      .map((article) => article.id)
  );

  return articlesData
    .filter((article) => {
      const articleCategory = normalizeCategory(article.category || "");
      return articleCategory === category && !latestArticleIds.has(article.id);
    })
    .slice(0, CONFIG.CATEGORY_GRID_SIZE)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

/**
 * Gets all articles for a specific category (for category page)
 */
function getAllCategoryArticles(category) {
  return articlesData
    .filter((article) => normalizeCategory(article.category || "") === category)
    .slice(0, CONFIG.INITIAL_CATEGORY_ARTICLES);
}

/**
 * Searches articles by category and tags
 */
function searchArticles(query) {
  const normalizedQuery = query.toLowerCase().trim();

  if (!normalizedQuery) return [];

  return articlesData
    .filter((article) => {
      const titleMatch = article.title?.toLowerCase().includes(normalizedQuery);
      const categoryMatch = normalizeCategory(article.category || "").includes(
        normalizedQuery
      );
      const tagsMatch =
        Array.isArray(article.tags) &&
        article.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery));

      return titleMatch || categoryMatch || tagsMatch;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}
// ============================================================================
// Content Population Functions
// ============================================================================

/**
 * Populates main bento grid layout with articles
 */
async function populateMainLayout(articles, elements) {
  // Preload first 3 images
  const preloadPromises = articles
    .slice(0, 3)
    .map((article) =>
      preloadImage(article.image || "assets/images/fallback_image.png")
    );

  // Populate huge hero card
  if (articles[0] && elements.hugeCard) {
    await populateArticleCard(elements.hugeCard, articles[0]);
    elements.hugeCard.setAttribute("data-article-id", articles[0].id);
    elements.hugeCard.style.display = "block";
  }

  // Populate side-by-side cards
  if (elements.sideBySideContainer) {
    const sideBySideCards =
      elements.sideBySideContainer.querySelectorAll(".article-card");

    for (let i = 0; i < sideBySideCards.length; i++) {
      if (articles[i + 1]) {
        await populateArticleCard(sideBySideCards[i], articles[i + 1]);
        sideBySideCards[i].style.display = "block";
      } else {
        sideBySideCards[i].style.display = "none";
      }
    }
  }

  // Populate fourth article slot
  if (elements.articleFourContainer) {
    const articleFourCard =
      elements.articleFourContainer.querySelector(".article-card");

    if (articles[3] && articleFourCard) {
      await populateArticleCard(articleFourCard, articles[3]);
      articleFourCard.style.display = "block";
    } else if (articleFourCard) {
      articleFourCard.style.display = "none";
    }
  }

  // Populate fifth article slot
  if (elements.articleFiveContainer) {
    const articleFiveCard =
      elements.articleFiveContainer.querySelector(".article-card");

    if (articles[4] && articleFiveCard) {
      await populateArticleCard(articleFiveCard, articles[4]);
      articleFiveCard.style.display = "block";
    } else if (articleFiveCard) {
      articleFiveCard.style.display = "none";
    }
  }
}

/**
 * Populates category page hero section
 */
async function populateCategoryHero(articles, elements) {
  if (articles[0] && elements.heroCard) {
    await populateArticleCard(elements.heroCard, articles[0]);
  }

  for (let i = 0; i < elements.sideCards.length; i++) {
    if (articles[i + 1] && elements.sideCards[i]) {
      await populateArticleCard(elements.sideCards[i], articles[i + 1]);
    }
  }
}

/**
 * Populates category page article list
 */
async function populateCategoryList(articles, listContainer) {
  listContainer.innerHTML = "";

  for (const article of articles) {
    const card = await createArticleCard(article, "small");
    listContainer.appendChild(card);
  }
}

/**
 * Populates category grids on main page
 */
async function populateCategoryGrids() {
  const categoryGrids = document.querySelectorAll(".category-grid");
  const usedArticleIds = new Set();

  console.log(`Found ${categoryGrids.length} category grids`);

  for (const grid of categoryGrids) {
    const category = normalizeCategory(
      grid.getAttribute("data-category") || ""
    );
    console.log(`Populating grid for category: ${category}`);

    const categoryArticles = articlesData
      .filter((article) => {
        const articleCategory = normalizeCategory(article.category || "");
        return articleCategory === category && !usedArticleIds.has(article.id);
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, CONFIG.CATEGORY_GRID_SIZE);

    console.log(`Found ${categoryArticles.length} articles for ${category}`);

    for (const article of categoryArticles) {
      const card = await createArticleCard(article, "small");
      grid.appendChild(card);
      usedArticleIds.add(article.id);
    }
  }
}

// ============================================================================
// Initialization Functions
// ============================================================================

/**
 * Calculates daily rotation index based on days since launch
 */
function calculateDailyRotationIndex() {
  const today = new Date();
  const daysSinceLaunch = Math.floor(
    (today - CONFIG.LAUNCH_DATE) / (1000 * 60 * 60 * 24)
  );

  let startIndex = daysSinceLaunch * CONFIG.ARTICLES_PER_DAY;

  // Add this check:
  if (startIndex >= articlesData.length) {
    startIndex = 0; // Reset to beginning
  }

  return startIndex;
}

/**
 * Assigns date to articles for display consistency
 */
function assignCurrentDateToArticles() {
  const today = new Date();

  articlesData.forEach((article, index) => {
    const dayIndex = Math.floor(index / CONFIG.ARTICLES_PER_DAY);
    const articleDate = new Date(CONFIG.LAUNCH_DATE);
    articleDate.setDate(articleDate.getDate() + dayIndex);

    article.date = articleDate.toISOString().split("T")[0];
  });
}

/**
 * Initialize articles data
 */
async function initializeArticleData() {
  try {
    console.log("Loading articles data...");

    const response = await fetch("data/articles.json");
    if (!response.ok) {
      throw new Error(`Failed to fetch articles: ${response.status}`);
    }

    articlesData = await response.json();

    // Check for admin mode
    const urlParams = new URLSearchParams(window.location.search);
    const isAdminMode = urlParams.get("admin") === "true";

    if (!isAdminMode) {
      // Only keep published articles for normal users
      const today = new Date();
      const maxPublishedIndex =
        Math.floor((today - CONFIG.LAUNCH_DATE) / (1000 * 60 * 60 * 24)) *
          CONFIG.ARTICLES_PER_DAY +
        CONFIG.ARTICLES_PER_DAY;
      articlesData = articlesData.slice(0, maxPublishedIndex);
      console.log(
        `Normal mode: Showing ${articlesData.length} published articles`
      );
    } else {
      console.log(`Admin mode: Showing all ${articlesData.length} articles`);
    }

    console.log(`Loaded ${articlesData.length} articles`);

    currentStartIndex = calculateDailyRotationIndex();
    assignCurrentDateToArticles();

    console.log("Categories found:", [
      ...new Set(articlesData.map((a) => a.category)),
    ]);

    return true;
  } catch (error) {
    console.error("Error loading articles:", error);
    return false;
  }
}

// ============================================================================
// Export Functions
// ============================================================================
export {
  initializeArticleData,
  getArticlesByCategory,
  getAllCategoryArticles,
  searchArticles,
  populateMainLayout,
  populateCategoryHero,
  populateCategoryList,
  populateCategoryGrids,
  articlesData,
  CONFIG,
};
