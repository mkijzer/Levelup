// ============================================================================
// data.js - ARTICLE DATA MANAGEMENT SYSTEM
// ============================================================================
// Description: Core data fetching and article management with daily rotation
// Author: Development Team
// Version: 3.2 - Fixed orphaned code and structure issues
// ============================================================================

import { normalizeCategory, formatDate, preloadImage } from "./utils.js";
import { createArticleCard, populateArticleCard } from "./articleCards.js";

// ============================================================================
// APPLICATION STATE
// ============================================================================
/** @type {Array} - All articles loaded from JSON */
let articlesData = [];

/** @type {Array<string>} - Track which random articles have been shown */
let randomArticleHistory = [];

/** @type {number} - Current day's starting index for daily rotation */
let currentStartIndex = 0;

/** @type {string} - Track current category for navigation */
let currentCategory = "latest";

/** @type {boolean} - Track if we're in category page view */
let isInCategoryPage = false;

// ============================================================================
// CONFIGURATION CONSTANTS
// ============================================================================
const CONFIG = {
  CATEGORIES: ["health", "coins", "hack", "ai"],
  ARTICLES_PER_DAY: 5,
  LAUNCH_DATE: new Date("2025-01-15"), // Change to your actual launch date
  INITIAL_CATEGORY_ARTICLES: 15,
  LOAD_MORE_BATCH_SIZE: 6,
  CATEGORY_GRID_SIZE: 6,
};

// ============================================================================
// DOM ELEMENT GETTERS
// ============================================================================
/**
 * Gets main layout elements for content display
 * @returns {Object} Object containing main layout elements
 */
function getLayoutElements() {
  return {
    bentoGrid: document.querySelector(".bento-grid"),
    articleView: document.querySelector(".article-view"),
    latestLabel: document.querySelector(".category-label.latest-label"),
    hugeCard: document.querySelector(".bento-grid .article-card.huge"),
    sideBySideContainer: document.querySelector(".side-by-side-container"),
    articleFourContainer: document.querySelector(".article-four-container"),
    articleFiveContainer: document.querySelector(".article-five-container"),
    categoryTitle: document.getElementById("category-title"),
  };
}

/**
 * Gets category page elements
 * @returns {Object} Object containing category page elements
 */
function getCategoryPageElements() {
  return {
    mainContent: document.getElementById("main-content-area"),
    categoryPageView: document.getElementById("category-page-view"),
    categoryTitle: document.querySelector(".category-page-title"),
    heroCard: document.querySelector(".category-hero-grid .article-card.huge"),
    sideCards: document.querySelectorAll(".category-side-cards .article-card"),
    listContainer: document.querySelector(".category-articles-list"),
    loadMoreButton: document.querySelector(".load-more-button"),
    categoryArticleView: document.querySelector(".category-article-view"),
  };
}

// ============================================================================
// PUBLIC API FUNCTIONS
// ============================================================================

/**
 * Loads articles for a specific category in main view
 * @param {string} category - Category to load ('latest', 'health', etc.)
 */
export async function loadCategory(category) {
  currentCategory = category;
  isInCategoryPage = false;
  console.log(`Loading category: ${category}`);

  const elements = getLayoutElements();
  if (!elements.bentoGrid) {
    console.error("Main layout elements not found");
    return;
  }

  resetMainViewState(elements);
  updateCategoryTitle(category);

  const articles = getArticlesByCategory(category);
  console.log(`Found ${articles.length} articles for ${category}`);

  await populateMainLayout(articles, elements);
  window.scrollTo(0, 0);
}

/**
 * Loads search results in main view
 * @param {string} query - Search query
 */
export async function loadSearchResults(query) {
  const elements = getLayoutElements();
  if (!elements.bentoGrid) return;

  resetMainViewState(elements);
  updateCategoryTitle(`SEARCH: ${query.toUpperCase()}`);

  const articles = searchArticles(query);
  await populateMainLayout(articles, elements);
}

/**
 * Loads category page with extended article list
 * @param {string} category - Category to load
 */
export async function loadCategoryPage(category) {
  currentCategory = category;
  isInCategoryPage = true;

  console.log(`Loading category page: ${category}`);

  const elements = getCategoryPageElements();

  showCategoryPageView(elements, category);
  resetLoadMoreButton(elements.loadMoreButton);

  const categoryArticles = getAllCategoryArticles(category);

  await populateCategoryHero(categoryArticles.slice(0, 3), elements);
  await populateCategoryList(categoryArticles.slice(3), elements.listContainer);

  if (elements.categoryArticleView) {
    elements.categoryArticleView.classList.add("hidden");
  }

  setupCategoryPageInteractions(elements);
}

/**
 * Loads a random article
 */
export function loadRandomArticle() {
  if (articlesData.length === 0) {
    console.warn("No articles available for random selection");
    return;
  }

  const randomArticle = getRandomArticle();
  showArticleView(randomArticle.id);
}

// ============================================================================
// ARTICLE DATA FUNCTIONS
// ============================================================================

/**
 * Gets articles for a specific category with daily rotation logic
 * @param {string} category - Category to get articles for
 * @returns {Array} Array of articles
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
 * @returns {Array} Array of latest articles
 */
function getLatestArticles() {
  const endIndex = currentStartIndex + CONFIG.ARTICLES_PER_DAY;
  return articlesData.slice(currentStartIndex, endIndex).reverse();
}

/**
 * Gets category articles excluding today's latest
 * @param {string} category - Category to filter
 * @returns {Array} Array of category articles
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
 * @param {string} category - Category to get articles for
 * @returns {Array} All articles in category
 */
function getAllCategoryArticles(category) {
  return articlesData
    .filter((article) => normalizeCategory(article.category || "") === category)
    .slice(0, CONFIG.INITIAL_CATEGORY_ARTICLES);
}

/**
 * Searches articles by category and tags
 * @param {string} query - Search query
 * @returns {Array} Array of matching articles
 */
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
    .slice(0, CONFIG.ARTICLES_PER_DAY)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

/**
 * Gets a random article that hasn't been shown recently
 * @returns {Object} Random article object
 */
function getRandomArticle() {
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
  return randomArticle;
}

// ============================================================================
// UI STATE MANAGEMENT
// ============================================================================

/**
 * Resets main view state to show bento grid
 * @param {Object} elements - Layout elements
 */
function resetMainViewState(elements) {
  if (elements.bentoGrid) elements.bentoGrid.style.display = "";
  if (elements.articleView) elements.articleView.classList.add("hidden");
  if (elements.latestLabel) elements.latestLabel.style.display = "block";

  const categoryPageView = document.getElementById("category-page-view");
  if (categoryPageView) {
    categoryPageView.classList.add("hidden");
  }
}

/**
 * Updates the category title display
 * @param {string} category - Category name
 */
function updateCategoryTitle(category) {
  const categoryTitle = document.getElementById("category-title");
  if (categoryTitle) {
    const displayCategory =
      category.charAt(0).toUpperCase() + category.slice(1);
    categoryTitle.textContent =
      category === "latest" ? "Latest" : displayCategory;
  }
}

/**
 * Shows category page view and hides main content
 * @param {Object} elements - Category page elements
 * @param {string} category - Category name
 */
function showCategoryPageView(elements, category) {
  elements.mainContent.style.display = "none";
  elements.categoryPageView.classList.remove("hidden");

  if (elements.categoryTitle) {
    elements.categoryTitle.textContent =
      category.charAt(0).toUpperCase() + category.slice(1);
  }
}

/**
 * Exits category page view and returns to main content
 */
function exitCategoryPage() {
  const categoryPageView = document.getElementById("category-page-view");
  const mainContent = document.getElementById("main-content-area");

  if (categoryPageView && !categoryPageView.classList.contains("hidden")) {
    categoryPageView.classList.add("hidden");
    if (mainContent) {
      mainContent.style.display = "";
    }
  }

  isInCategoryPage = false;
}

/**
 * Resets load more button to default state
 * @param {HTMLElement} loadMoreButton - Load more button element
 */
function resetLoadMoreButton(loadMoreButton) {
  if (loadMoreButton) {
    loadMoreButton.textContent = "Load More";
    loadMoreButton.style.cursor = "pointer";
    loadMoreButton.style.backgroundColor = "";
    loadMoreButton.style.display = "block";
  }
}

// ============================================================================
// CONTENT POPULATION
// ============================================================================

/**
 * Populates main bento grid layout with articles
 * @param {Array} articles - Articles to display
 * @param {Object} elements - Layout elements
 */
async function populateMainLayout(articles, elements) {
  // Populate huge hero card
  if (articles[0] && elements.hugeCard) {
    await populateArticleCard(elements.hugeCard, articles[0]);
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
 * @param {Array} articles - First 3 articles for hero section
 * @param {Object} elements - Category page elements
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
 * @param {Array} articles - Articles to display in list
 * @param {HTMLElement} listContainer - Container element
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
// ARTICLE VIEW FUNCTIONS
// ============================================================================

/**
 * Shows individual article in full view
 * @param {string} articleId - ID of article to show
 */
async function showArticleView(articleId) {
  console.log(`Showing article: ${articleId}`);

  const article = articlesData.find((a) => a.id === articleId);
  if (!article) {
    console.error(`Article not found: ${articleId}`);
    return;
  }

  if (isInCategoryPage) {
    const elements = getCategoryPageElements();
    const categoryView = elements.categoryArticleView;

    if (categoryView) {
      const heroGrid = document.querySelector(".category-hero-grid");
      const articlesList = elements.listContainer;
      const loadMoreBtn = elements.loadMoreButton;

      if (heroGrid) heroGrid.style.display = "none";
      if (articlesList) articlesList.style.display = "none";
      if (loadMoreBtn) loadMoreBtn.style.display = "none";

      categoryView.classList.remove("hidden");
      populateArticleView(article, categoryView);
      setupCategoryCloseButton();
    }
  } else {
    const elements = getLayoutElements();
    if (!elements.bentoGrid || !elements.articleView) {
      console.error("Required elements not found");
      return;
    }

    elements.bentoGrid.style.display = "none";
    elements.articleView.classList.remove("hidden");

    if (elements.latestLabel) {
      elements.latestLabel.style.display = "none";
    }

    populateArticleView(article, elements.articleView);
    populateRandomArticles(articleId);
    setupCloseButton();
  }

  window.scrollTo(0, 0);
}

/**
 * Populates article view with content
 * @param {Object} article - Article object to display
 * @param {HTMLElement} container - Container element (main or category article view)
 */
function populateArticleView(article, container) {
  const elements = {
    title: container.querySelector(".main-article-title"),
    image: container.querySelector(".main-article-image"),
    body: container.querySelector(".main-article-body"),
    author: container.querySelector(".main-article-author"),
    tags: container.querySelector(".article-tags"),
  };

  if (elements.title) {
    elements.title.textContent = article.title || "Untitled Article";
  }

  if (elements.image) {
    elements.image.src = article.image || "assets/images/fallback_image.png";
    elements.image.alt = article.title || "Article Image";
  }

  if (elements.body) {
    if (article.content) {
      elements.body.innerHTML = article.content;
    } else {
      elements.body.innerHTML = createFallbackContent(article);
    }
  }

  if (elements.author) {
    elements.author.textContent = article.author || "Anonymous";
  }

  if (elements.tags && article.tags) {
    populateArticleTags(elements.tags, article.tags);
  }

  if (isInCategoryPage) {
    populateRelatedCategoryArticles(container, article.id);
  }
}

/**
 * Populates related category articles below the main article
 * @param {HTMLElement} container - Article view container
 * @param {string} currentArticleId - ID of current article to exclude
 */
function populateRelatedCategoryArticles(container, currentArticleId) {
  const otherCategoryArticles = articlesData
    .filter(
      (article) =>
        normalizeCategory(article.category || "") === currentCategory &&
        article.id !== currentArticleId
    )
    .slice(0, 6);

  const mainArticle = container.querySelector(".main-article");
  if (!mainArticle) return;

  const existingRelated = mainArticle.querySelector(".related-articles");
  if (existingRelated) {
    existingRelated.remove();
  }

  const relatedContainer = document.createElement("div");
  relatedContainer.className = "related-articles";
  relatedContainer.innerHTML = `
    <h3 style="color: var(--text-primary); margin: 2rem 0 1rem 0; text-align: center;">More ${currentCategory} articles:</h3>
    <div class="related-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; margin-top: 1rem;"></div>
  `;

  mainArticle.appendChild(relatedContainer);

  const relatedGrid = relatedContainer.querySelector(".related-grid");

  otherCategoryArticles.forEach(async (article) => {
    const card = await createArticleCard(article, "small");
    relatedGrid.appendChild(card);
  });
}

/**
 * Creates fallback content for articles without body text
 * @param {Object} article - Article object
 * @returns {string} HTML content
 */
function createFallbackContent(article) {
  return `
    <p>Published on ${formatDate(article.date)} in ${article.category}</p>
    <p>This is a featured article about ${article.title.toLowerCase()}. The full content would be displayed here in a real implementation.</p>
    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.</p>
    <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
  `;
}

/**
 * Populates article tags
 * @param {HTMLElement} tagsElement - Tags container element
 * @param {Array} tags - Array of tag strings
 */
function populateArticleTags(tagsElement, tags) {
  tagsElement.innerHTML = "";

  tags.forEach((tag) => {
    const tagElement = document.createElement("span");
    tagElement.className = "tag";
    tagElement.textContent = tag;

    tagElement.addEventListener("click", () => {
      tagElement.classList.add("clicked");
      setTimeout(() => {
        console.log(`Tag clicked: ${tag}`);
      }, 250);
    });

    tagsElement.appendChild(tagElement);
  });
}

/**
 * Populates random articles in sidebar
 * @param {string} currentArticleId - ID of current article to exclude
 */
function populateRandomArticles(currentArticleId) {
  const otherArticles = articlesData.filter(
    (article) => article.id !== currentArticleId
  );

  const randomArticles = otherArticles
    .sort(() => Math.random() - 0.5)
    .slice(0, 2);

  const randomCards = document.querySelectorAll(
    ".random-articles .article-card"
  );

  randomArticles.forEach((article, index) => {
    if (randomCards[index]) {
      populateArticleCard(randomCards[index], article);
    }
  });
}

/**
 * Closes article view and returns to previous context
 */
function closeArticleView() {
  if (isInCategoryPage) {
    const elements = getCategoryPageElements();
    const categoryView = elements.categoryArticleView;

    if (categoryView) {
      categoryView.classList.add("hidden");

      const heroGrid = document.querySelector(".category-hero-grid");
      const articlesList = elements.listContainer;
      const loadMoreBtn = elements.loadMoreButton;

      if (heroGrid) heroGrid.style.display = "";
      if (articlesList) articlesList.style.display = "";
      if (loadMoreBtn) loadMoreBtn.style.display = "";
    }
  } else {
    const elements = getLayoutElements();

    if (elements.bentoGrid) {
      elements.bentoGrid.style.display = "";
    }

    if (elements.articleView) {
      elements.articleView.classList.add("hidden");
    }

    if (elements.latestLabel) {
      elements.latestLabel.style.display = "block";
    }
  }

  window.scrollTo(0, 0);
}

// ============================================================================
// LOAD MORE FUNCTIONALITY
// ============================================================================

/**
 * Loads more articles for category page
 */
async function loadMoreCategoryArticles() {
  const elements = getCategoryPageElements();
  const categoryTitle = elements.categoryTitle.textContent.toLowerCase();
  const currentCount = elements.listContainer.children.length + 3;

  const allCategoryArticles = articlesData.filter(
    (article) => normalizeCategory(article.category || "") === categoryTitle
  );

  const moreArticles = allCategoryArticles.slice(
    currentCount,
    currentCount + CONFIG.LOAD_MORE_BATCH_SIZE
  );

  for (const article of moreArticles) {
    const card = await createArticleCard(article, "small");
    elements.listContainer.appendChild(card);
  }

  if (moreArticles.length < CONFIG.LOAD_MORE_BATCH_SIZE) {
    showEndOfArticlesMessage(elements.loadMoreButton);
  }
}

/**
 * Shows end of articles message on load more button
 * @param {HTMLElement} loadMoreButton - Load more button element
 */
function showEndOfArticlesMessage(loadMoreButton) {
  loadMoreButton.textContent =
    "You've read the last article! Why not try to level up in another category?";
  loadMoreButton.style.cursor = "default";
  loadMoreButton.style.backgroundColor = "rgba(255, 255, 255, 0.1)";

  loadMoreButton.removeEventListener("click", loadMoreCategoryArticles);
}

// ============================================================================
// EVENT SETUP FUNCTIONS
// ============================================================================

/**
 * Sets up category page interactions (back button, load more)
 * @param {Object} elements - Category page elements
 */
function setupCategoryPageInteractions(elements) {
  const backButton = document.querySelector(".back-button");
  if (backButton) {
    backButton.addEventListener("click", () => {
      elements.categoryPageView.classList.add("hidden");
      elements.mainContent.style.display = "";
    });
  }

  if (elements.loadMoreButton) {
    elements.loadMoreButton.removeEventListener(
      "click",
      loadMoreCategoryArticles
    );
    elements.loadMoreButton.addEventListener("click", loadMoreCategoryArticles);
  }
}

/**
 * Sets up close button for main article view
 */
function setupCloseButton() {
  const closeButton = document.querySelector(".article-view .close-article");
  if (closeButton) {
    closeButton.replaceWith(closeButton.cloneNode(true));

    const newCloseButton = document.querySelector(
      ".article-view .close-article"
    );
    newCloseButton.addEventListener("click", closeArticleView);
  }
}

/**
 * Sets up close button for category article view
 */
function setupCategoryCloseButton() {
  const closeButton = document.querySelector(
    ".category-article-view .close-article"
  );
  if (closeButton) {
    closeButton.replaceWith(closeButton.cloneNode(true));

    const newCloseButton = document.querySelector(
      ".category-article-view .close-article"
    );
    newCloseButton.addEventListener("click", closeArticleView);
  }
}

/**
 * Sets up event delegation for article card clicks
 */
function setupEventDelegation() {
  const container = document.querySelector(".container");
  if (container) {
    container.addEventListener("click", handleArticleCardClick);
  }

  const categoryPageView = document.getElementById("category-page-view");
  if (categoryPageView) {
    categoryPageView.addEventListener("click", handleArticleCardClick);
  }
}

/**
 * Handles article card click events
 * @param {Event} e - Click event
 */
function handleArticleCardClick(e) {
  const card = e.target.closest(".article-card");
  if (card && card.getAttribute("data-article-id")) {
    const articleId = card.getAttribute("data-article-id");
    console.log(`Clicked article: ${articleId}`);
    showArticleView(articleId);
  }
}

/**
 * Sets up navigation event listeners
 */
function setupNavigation() {
  window.addEventListener("hashchange", () => {
    const hash = window.location.hash.slice(1);
    const category = hash || "latest";

    if (category !== "category") {
      const mainArticleView = document.querySelector(".article-view");
      if (mainArticleView && !mainArticleView.classList.contains("hidden")) {
        mainArticleView.classList.add("hidden");
      }

      const categoryArticleView = document.querySelector(
        ".category-article-view"
      );
      if (
        categoryArticleView &&
        !categoryArticleView.classList.contains("hidden")
      ) {
        categoryArticleView.classList.add("hidden");
      }

      exitCategoryPage();
      loadCategory(category);
    }
  });

  document.querySelectorAll(".nav-item a").forEach((link) => {
    link.addEventListener("click", handleNavigationClick);
  });
}

/**
 * Handles navigation link clicks
 * @param {Event} e - Click event
 */
function handleNavigationClick(e) {
  e.preventDefault();
  const href = e.target.getAttribute("href");

  if (href === "#random") {
    exitCategoryPage();
    loadRandomArticle();
  } else if (href === "#category") {
    return;
  } else if (href === "#latest") {
    exitCategoryPage();
    loadCategory("latest");
  } else {
    const category = href.replace("#", "");

    exitCategoryPage();

    const mainArticleView = document.querySelector(".article-view");
    if (mainArticleView) {
      mainArticleView.classList.add("hidden");
    }

    const categoryArticleView = document.querySelector(
      ".category-article-view"
    );
    if (categoryArticleView) {
      categoryArticleView.classList.add("hidden");
    }

    loadCategoryPage(category);
  }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Calculates daily rotation index based on days since launch
 * @returns {number} Starting index for today's articles
 */
function calculateDailyRotationIndex() {
  const today = new Date();
  const daysSinceLaunch = Math.floor(
    (today - CONFIG.LAUNCH_DATE) / (1000 * 60 * 60 * 24)
  );

  const totalArticles = articlesData.length;
  const startIndex = Math.max(
    0,
    totalArticles - (daysSinceLaunch + 1) * CONFIG.ARTICLES_PER_DAY
  );

  console.log(
    `Day ${
      daysSinceLaunch + 1
    }: Using articles starting from index ${startIndex}`
  );

  return startIndex;
}

/**
 * Assigns current date to all articles for display consistency
 */
function assignCurrentDateToArticles() {
  const today = new Date();
  const todayString = today.toISOString().split("T")[0];

  articlesData.forEach((article) => {
    article.date = todayString;
  });
}

/**
 * Main application initialization function
 */
async function initializeApp() {
  try {
    console.log("Initializing application...");

    const response = await fetch("data/articles.json");
    if (!response.ok) {
      throw new Error(`Failed to fetch articles: ${response.status}`);
    }

    articlesData = await response.json();
    console.log(`Loaded ${articlesData.length} articles`);

    currentStartIndex = calculateDailyRotationIndex();
    assignCurrentDateToArticles();

    console.log("Categories found:", [
      ...new Set(articlesData.map((a) => a.category)),
    ]);

    setupEventDelegation();
    await populateCategoryGrids();
    setupNavigation();

    loadCategory("latest");

    console.log("Application initialized successfully");
  } catch (error) {
    console.error("Error initializing application:", error);
  }
}

// Auto-initialize when DOM is ready
document.addEventListener("DOMContentLoaded", initializeApp);

/**
 * Public function to switch categories from any state
 * @param {string} category - Category to switch to
 */
export function switchToCategory(category) {
  isInCategoryPage = false;

  const mainArticleView = document.querySelector(".article-view");
  if (mainArticleView) {
    mainArticleView.classList.add("hidden");
  }

  const categoryArticleView = document.querySelector(".category-article-view");
  if (categoryArticleView) {
    categoryArticleView.classList.add("hidden");
  }

  const heroGrid = document.querySelector(".category-hero-grid");
  const articlesList = document.querySelector(".category-articles-list");
  const loadMoreBtn = document.querySelector(".load-more-button");

  if (heroGrid) heroGrid.style.display = "";
  if (articlesList) articlesList.style.display = "";
  if (loadMoreBtn) loadMoreBtn.style.display = "";

  loadCategoryPage(category);
}

// ============================================================================
// LEGACY EXPORT (for backwards compatibility)
// ============================================================================
export function handleArticleClick(e) {
  console.warn(
    "handleArticleClick is deprecated. Use event delegation instead."
  );
  e.preventDefault();
  const articleId = e.currentTarget.getAttribute("data-article-id");
  if (articleId) showArticleView(articleId);
}
