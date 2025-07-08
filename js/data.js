// ============================================================================
// data.js - CLEANED VERSION WITH DAILY ROTATION
// ============================================================================
// Description: Core data fetching and article management with daily rotation
// Version: 2.1 - Added daily rotation starting from bottom of JSON
// ============================================================================

import { normalizeCategory, formatDate, preloadImage } from "./utils.js";
import { createArticleCard, populateArticleCard } from "./articleCards.js";

// ============================================================================
// State Management
// ============================================================================
let articlesData = [];
let randomArticleHistory = [];
let lastLatestScrollY = 0;
let currentStartIndex = 0; // Track current day's starting index

// ============================================================================
// Configuration
// ============================================================================
const CATEGORIES = ["health", "coins", "hack", "ai"]; // Fixed to match your data
const MOBILE_MENU_DELAY = 900;

// ============================================================================
// Event Handlers
// ============================================================================
export function handleArticleClick(e) {
  e.preventDefault();
  const articleId = e.currentTarget.getAttribute("data-article-id");
  if (articleId) showArticleView(articleId);
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Loads articles for a specific category
 */
export async function loadCategory(category) {
  console.log(`Loading category: ${category}`);

  // Get containers once
  const elements = getLayoutElements();
  if (!elements.bentoGrid) return;

  // Reset view state
  resetViewState(elements);

  // Update title
  updateCategoryTitle(category);

  // Get articles based on category
  const articles = getArticlesByCategory(category);
  console.log(`Found ${articles.length} articles for ${category}`);

  // Populate containers
  await populateMainLayout(articles, elements);
}

/**
 * Load search results
 */
export async function loadSearchResults(query) {
  const elements = getLayoutElements();
  if (!elements.bentoGrid) return;

  resetViewState(elements);
  updateCategoryTitle(`SEARCH: ${query.toUpperCase()}`);

  const articles = searchArticles(query);
  await populateMainLayout(articles, elements);
}

/**
 * Load random article
 */
export function loadRandomArticle() {
  if (articlesData.length === 0) return;

  let availableArticles = articlesData.filter(
    (article) => !randomArticleHistory.includes(article.id)
  );

  if (availableArticles.length === 0) {
    randomArticleHistory = [];
    availableArticles = [...articlesData];
  }

  const randomIndex = Math.floor(Math.random() * availableArticles.length);
  const randomArticle = availableArticles[randomIndex];
  randomArticleHistory.push(randomArticle.id);

  showArticleView(randomArticle.id);
}

// ============================================================================
// Helper Functions
// ============================================================================

function getLayoutElements() {
  return {
    bentoGrid: document.querySelector(".bento-grid"),
    articleView: document.querySelector(".article-view"),
    latestLabel: document.querySelector(".category-label.latest-label"),
    hugeCard: document.querySelector(".bento-grid .article-card.huge"),
    sideBySideContainer: document.querySelector(".side-by-side-container"),
    articleFourContainer: document.querySelector(".article-four-container"),
    categoryTitle: document.getElementById("category-title"),
  };
}

function resetViewState(elements) {
  if (elements.bentoGrid) elements.bentoGrid.style.display = "";
  if (elements.articleView) elements.articleView.classList.add("hidden");
  if (elements.latestLabel) elements.latestLabel.style.display = "block";
}

function updateCategoryTitle(category) {
  const categoryTitle = document.getElementById("category-title");
  if (categoryTitle) {
    const displayCategory =
      category.charAt(0).toUpperCase() + category.slice(1);
    categoryTitle.textContent =
      category === "latest" ? "Latest" : displayCategory;
  }
}

function getArticlesByCategory(category) {
  if (category === "latest") {
    // Get current day's 4 articles starting from calculated index
    const endIndex = currentStartIndex + 4;
    return articlesData.slice(currentStartIndex, endIndex).reverse(); // newest first for display
  } else {
    // Get articles from specific category (excluding current "Latest" articles)
    const latestArticleIds = articlesData
      .slice(currentStartIndex, currentStartIndex + 4)
      .map((a) => a.id);

    return articlesData
      .filter((article) => {
        const articleCategory = normalizeCategory(article.category || "");
        return (
          articleCategory === category && !latestArticleIds.includes(article.id)
        );
      })
      .slice(0, 6)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }
}

function searchArticles(query) {
  const normalizedQuery = query.toLowerCase().trim();
  return articlesData
    .filter((article) => {
      const categoryMatch = normalizeCategory(article.category || "").includes(
        normalizedQuery
      );
      const tagsMatch =
        Array.isArray(article.tags) &&
        article.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery));
      return categoryMatch || tagsMatch;
    })
    .slice(0, 4)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

async function populateMainLayout(articles, elements) {
  // 1. Populate huge card
  if (articles[0] && elements.hugeCard) {
    await populateArticleCard(elements.hugeCard, articles[0]);
    elements.hugeCard.style.display = "block";
  }

  // 2. Populate side-by-side cards
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

  // 3. Populate fourth article
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
}

async function showArticleView(articleId) {
  console.log(`Showing article: ${articleId}`);

  // Find the article by ID
  const article = articlesData.find((a) => a.id === articleId);
  if (!article) {
    console.error(`Article not found: ${articleId}`);
    return;
  }

  // Get layout elements
  const elements = getLayoutElements();
  if (!elements.bentoGrid || !elements.articleView) {
    console.error("Required elements not found");
    return;
  }

  // Hide main grid and show article view
  elements.bentoGrid.style.display = "none";
  elements.articleView.classList.remove("hidden");

  // Hide latest label
  if (elements.latestLabel) {
    elements.latestLabel.style.display = "none";
  }

  // Populate article content
  populateArticleView(article);

  // Populate random articles in sidebar
  populateRandomArticles(articleId);

  // Setup close button
  setupCloseButton();

  // Scroll to top
  window.scrollTo(0, 0);
}

function populateArticleView(article) {
  // Get article view elements
  const titleElement = document.querySelector(".main-article-title");
  const imageElement = document.querySelector(".main-article-image");
  const bodyElement = document.querySelector(".main-article-body");
  const authorElement = document.querySelector(".main-article-author");
  const tagsElement = document.querySelector(".article-tags");

  // Populate title
  if (titleElement) {
    titleElement.textContent = article.title || "Untitled Article";
  }

  // Populate image
  if (imageElement) {
    imageElement.src = article.image || "assets/images/fallback_image.png";
    imageElement.alt = article.title || "Article Image";
  }

  // Populate body content
  if (bodyElement) {
    // If article has body content, use it; otherwise create placeholder
    if (article.content) {
      bodyElement.innerHTML = article.content;
    } else {
      // Create placeholder content based on article data
      bodyElement.innerHTML = `
        <p>Published on ${formatDate(article.date)} in ${article.category}</p>
        <p>This is a featured article about ${article.title.toLowerCase()}. The full content would be displayed here in a real implementation.</p>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.</p>
        <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
      `;
    }
  }

  // Populate author
  if (authorElement) {
    authorElement.textContent = article.author || "Anonymous";
  }

  // Populate tags
  if (tagsElement && article.tags) {
    tagsElement.innerHTML = "";
    article.tags.forEach((tag) => {
      const tagElement = document.createElement("span");
      tagElement.className = "tag";
      tagElement.textContent = tag;

      // Add click handler for tag
      tagElement.addEventListener("click", () => {
        tagElement.classList.add("clicked");
        setTimeout(() => {
          // Could implement tag search here
          console.log(`Searching for tag: ${tag}`);
        }, 250);
      });

      tagsElement.appendChild(tagElement);
    });
  }
}

function populateRandomArticles(currentArticleId) {
  // Get 2 random articles (excluding current one)
  const otherArticles = articlesData.filter(
    (article) => article.id !== currentArticleId
  );
  const randomArticles = otherArticles
    .sort(() => Math.random() - 0.5)
    .slice(0, 2);

  // Get random article cards
  const randomCards = document.querySelectorAll(
    ".random-articles .article-card"
  );

  randomArticles.forEach((article, index) => {
    if (randomCards[index]) {
      populateArticleCard(randomCards[index], article);
    }
  });
}

function setupCloseButton() {
  const closeButton = document.querySelector(".close-article");
  if (closeButton) {
    // Remove existing listeners
    closeButton.replaceWith(closeButton.cloneNode(true));

    // Add new listener
    const newCloseButton = document.querySelector(".close-article");
    newCloseButton.addEventListener("click", () => {
      closeArticleView();
    });
  }
}

function closeArticleView() {
  const elements = getLayoutElements();

  // Show main grid and hide article view
  if (elements.bentoGrid) {
    elements.bentoGrid.style.display = "";
  }

  if (elements.articleView) {
    elements.articleView.classList.add("hidden");
  }

  // Show latest label
  if (elements.latestLabel) {
    elements.latestLabel.style.display = "block";
  }

  // Scroll to top
  window.scrollTo(0, 0);
}

// ============================================================================
// Initialization
// ============================================================================
document.addEventListener("DOMContentLoaded", initializeApp);

async function initializeApp() {
  try {
    // Fetch articles
    const response = await fetch("data/articles.json");
    if (!response.ok) throw new Error("Failed to fetch articles");

    articlesData = await response.json();

    // Calculate daily rotation starting from bottom of JSON
    const today = new Date();
    const launchDate = new Date("2025-01-15"); // Change to your launch date
    const daysSinceLaunch = Math.floor(
      (today - launchDate) / (1000 * 60 * 60 * 24)
    );

    // Start from bottom of JSON, move up 4 articles per day
    const totalArticles = articlesData.length;
    const articlesPerDay = 4;
    currentStartIndex = Math.max(
      0,
      totalArticles - (daysSinceLaunch + 1) * articlesPerDay
    );

    console.log(
      `Day ${
        daysSinceLaunch + 1
      }: Using articles starting from index ${currentStartIndex}`
    );

    // Assign today's date to all articles (for display purposes)
    articlesData.forEach((article) => {
      article.date = today.toISOString().split("T")[0];
    });

    console.log(`Loaded ${articlesData.length} articles`);
    console.log("Categories found:", [
      ...new Set(articlesData.map((a) => a.category)),
    ]);

    // Setup event delegation
    setupEventDelegation();

    // Populate category grids
    await populateCategoryGrids();

    // Setup navigation
    setupNavigation();

    // Load initial content
    loadCategory("latest");
  } catch (error) {
    console.error("Error initializing app:", error);
  }
}

function setupEventDelegation() {
  const container = document.querySelector(".container");
  if (container) {
    container.addEventListener("click", (e) => {
      const card = e.target.closest(".article-card");
      if (card && card.getAttribute("data-article-id")) {
        // Create a new event object with the card as currentTarget
        const articleId = card.getAttribute("data-article-id");
        console.log(`Clicked article: ${articleId}`); // Debug line
        showArticleView(articleId); // Call directly instead of handleArticleClick
      }
    });
  }
}

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
      .slice(0, 6);

    console.log(`Found ${categoryArticles.length} articles for ${category}`);

    for (const article of categoryArticles) {
      const card = await createArticleCard(article, "small");
      grid.appendChild(card);
      usedArticleIds.add(article.id);
    }
  }
}

function setupNavigation() {
  // Hash change handling
  window.addEventListener("hashchange", () => {
    const category = window.location.hash.slice(1) || "latest";
    loadCategory(category);
  });

  // Nav item clicks
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const link = item.querySelector("a");
      if (link) {
        const href = link.getAttribute("href");
        if (href === "#random") {
          loadRandomArticle();
        } else {
          window.location.hash = href;
        }
      }
    });
  });
}
