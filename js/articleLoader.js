// ============================================================================
// articleLoader.js - ARTICLE LOADING AND DISPLAY
// ============================================================================
// Description: Handles all article loading, card creation, and grid population
// Version: 1.1 - Latest fix for "latest" articles
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
  ARTICLES_PER_WEEK: 3,
  LAUNCH_DATE: new Date("2025-10-05"),
  INITIAL_CATEGORY_ARTICLES: 10,
  LOAD_MORE_BATCH_SIZE: 6,
  CATEGORY_GRID_SIZE: 6,
};

// ============================================================================
// Application State
// ============================================================================
let articlesData = [];

// ============================================================================
// Helper Functions
// ============================================================================

function getLatestThreeArticles() {
  return articlesData
    .slice() // avoid mutating original array
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 3);
}

/**
 * Gets articles for a specific category
 */
function getArticlesByCategory(category) {
  if (category === "latest") {
    return getLatestThreeArticles();
  } else {
    return getCategoryArticlesExcludingLatest(category);
  }
}

/**
 * Gets category articles excluding today's latest
 */
function getCategoryArticlesExcludingLatest(category) {
  const latestArticleIds = new Set(getLatestThreeArticles().map((a) => a.id));

  return articlesData
    .filter((article) => {
      const articleCategory = normalizeCategory(article.category || "");
      return articleCategory === category && !latestArticleIds.has(article.id);
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, CONFIG.CATEGORY_GRID_SIZE);
}

/**
 * Gets all articles for a category (category page)
 */
function getAllCategoryArticles(category) {
  return articlesData
    .filter((article) => normalizeCategory(article.category || "") === category)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, CONFIG.INITIAL_CATEGORY_ARTICLES);
}

/**
 * Searches articles
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
// Content Population
// ============================================================================

async function populateMainLayout(articles, elements) {
  // CRITICAL FIX: Ensure bento grid is visible before populating
  if (elements.bentoGrid) {
    elements.bentoGrid.style.display = "";
    elements.bentoGrid.classList.remove("hidden");
    elements.bentoGrid.classList.remove("hidden-element");
  }

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

  // Side-by-side cards
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

  // 4th article slot
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

  // 5th article slot
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

  await Promise.all(preloadPromises);
}

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

async function populateCategoryList(articles, listContainer) {
  listContainer.innerHTML = "";
  for (const article of articles) {
    const card = await createArticleCard(article, "small");
    listContainer.appendChild(card);
  }
}

async function populateCategoryGrids() {
  const categoryGrids = document.querySelectorAll(".category-grid");
  const usedArticleIds = new Set();
  const latestArticleIds = new Set(getLatestThreeArticles().map((a) => a.id));

  for (const grid of categoryGrids) {
    const category = normalizeCategory(
      grid.getAttribute("data-category") || ""
    );

    const categoryArticles = articlesData
      .filter((article) => {
        const articleCategory = normalizeCategory(article.category || "");
        return (
          articleCategory === category &&
          !usedArticleIds.has(article.id) &&
          !latestArticleIds.has(article.id)
        );
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, CONFIG.CATEGORY_GRID_SIZE);

    for (const article of categoryArticles) {
      const card = await createArticleCard(article, "small");
      grid.appendChild(card);
      usedArticleIds.add(article.id);
    }
  }
}

// ============================================================================
// Initialization
// ============================================================================

function assignCurrentDateToArticles() {
  const today = new Date();
  let currentPublishDate = new Date(today);
  while (![1, 3, 5].includes(currentPublishDate.getDay())) {
    currentPublishDate.setDate(currentPublishDate.getDate() - 1);
  }

  articlesData.forEach((article, index) => {
    const reverseIndex = articlesData.length - 1 - index;
    const articleDate = new Date(currentPublishDate);
    const weeksBack = Math.floor(reverseIndex / 3);
    const positionInWeek = reverseIndex % 3;
    let daysBack = weeksBack * 7;
    if (positionInWeek === 1) daysBack += 2;
    if (positionInWeek === 2) daysBack += 5;
    articleDate.setDate(currentPublishDate.getDate() - daysBack);
    article.date = articleDate.toISOString().split("T")[0];
  });
}

async function initializeArticleData() {
  try {
    const response = await fetch("data/articles.json");
    if (!response.ok)
      throw new Error(`Failed to fetch articles: ${response.status}`);

    articlesData = await response.json();

    const urlParams = new URLSearchParams(window.location.search);
    const isAdminMode = urlParams.get("admin") === "true";

    if (!isAdminMode) {
      const today = new Date();
      const launchDate = new Date(CONFIG.LAUNCH_DATE);

      // Publishing days: Monday (1), Wednesday (3), Friday (5)
      const publishDays = [1, 3, 5];

      // Count how many publish days have passed since launch
      let publishedCount = 0;
      let currentDate = new Date(launchDate);

      while (currentDate <= today) {
        const dayOfWeek = currentDate.getDay();
        if (publishDays.includes(dayOfWeek)) {
          publishedCount++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      articlesData = articlesData.slice(0, publishedCount);
    }

    assignCurrentDateToArticles();
    return true;
  } catch (error) {
    console.error("Error loading articles:", error);
    return false;
  }
}

// ============================================================================
// Exports
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
