// ============================================================================
// data.js - ARTICLE DATA MANAGEMENT SYSTEM
// ============================================================================
// Description: Core data fetching and article management with daily rotation
// Author: Development Team
// Version: 3.2 - Fixed orphaned code and structure issues
// ============================================================================

import {
  normalizeCategory,
  formatDate,
  preloadImage,
  calculateReadingTime,
} from "./utils.js";
import { createArticleCard, populateArticleCard } from "./articleCards.js";
import {
  latestSvg,
  healthSvg,
  coinsSvg,
  hackSvg,
  aiSvg,
  randomSvg,
  categorySvg,
  settingsSvg,
  xSvg,
  tiktokSvg,
  snapSvg,
  instagramSvg,
  youtubeSvg,
} from "./svg.js";

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
  LAUNCH_DATE: new Date("2025-08-18"), // Use today's date
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
  updateDesktopNavigation(category);
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

function searchArticlesByTag(tag) {
  // Get current article ID from the main article view
  const currentArticleTitle = document.querySelector(
    ".main-article .article-main-title"
  );
  const currentArticle = currentArticleTitle
    ? articlesData.find((a) => a.title === currentArticleTitle.textContent)
    : null;

  const tagArticles = articlesData.filter(
    (article) =>
      article.tags &&
      article.tags.includes(tag) &&
      article.id !== (currentArticle ? currentArticle.id : null)
  );

  if (tagArticles.length > 0) {
    // Fast direct approach - skip heavy category loading
    const elements = getLayoutElements();
    resetMainViewState(elements);
    updateCategoryTitle(`TAG: ${tag.toUpperCase()}`);
    populateMainLayout(tagArticles.slice(0, 5), elements);
    window.scrollTo(0, 0);
  }
}

function checkTagHasResults(tag) {
  const currentArticleTitle = document.querySelector(
    ".main-article .article-main-title"
  );
  const currentArticle = currentArticleTitle
    ? articlesData.find((a) => a.title === currentArticleTitle.textContent)
    : null;

  const tagArticles = articlesData.filter(
    (article) =>
      article.tags &&
      article.tags.includes(tag) &&
      article.id !== (currentArticle ? currentArticle.id : null)
  );

  return tagArticles.length > 0;
}
function showNoTagResultsMessage(tag) {
  const elements = getLayoutElements();
  resetMainViewState(elements);
  updateCategoryTitle(`TAG: ${tag.toUpperCase()}`);

  const smartCategory = findCategoryForTag(tag);
  const categoryText = smartCategory
    ? `Try articles from <span class="clickable-category" data-category="${smartCategory}" style="
      color: var(--accent-color); 
      cursor: pointer; 
      text-decoration: underline;
      font-weight: bold;
    ">${smartCategory.charAt(0).toUpperCase() + smartCategory.slice(1)}</span>`
    : `Check out our latest articles`;

  const messageHTML = `
    <div class="no-results-message" style="
      text-align: center; 
      padding: 60px 20px; 
      color: var(--text-primary);
    ">
      <h2 style="font-size: 2rem; margin-bottom: 20px;">
        No '${tag}' articles published yet!
      </h2>
      <p style="font-size: 1.2rem; color: var(--text-secondary); margin-bottom: 30px;">
        But we're cooking something up...
      </p>
      <p style="font-size: 1rem;">
        ${categoryText}
      </p>
    </div>
  `;

  elements.bentoGrid.innerHTML = messageHTML;
  elements.bentoGrid.style.display = "block";

  const categoryLink = elements.bentoGrid.querySelector(".clickable-category");
  if (categoryLink) {
    categoryLink.addEventListener("click", () => {
      const category = categoryLink.getAttribute("data-category");
      console.log("Category clicked:", category);

      // Get category articles directly
      const categoryArticles = getCategoryArticlesExcludingLatest(category);
      console.log("Found articles:", categoryArticles.length);

      // Clear message manually
      elements.bentoGrid.innerHTML = "";
      console.log("Cleared bento grid");

      // Hide the latest label (first Health title)
      const latestLabel = document.querySelector(
        ".category-label.latest-label"
      );
      if (latestLabel) {
        latestLabel.style.display = "none";
      }

      // Just try simple approach
      updateCategoryTitle(category.charAt(0).toUpperCase() + category.slice(1));

      if (categoryArticles.length > 0) {
        populateMainLayout(categoryArticles, elements);
        console.log("Populated layout");
      } else {
        console.log("No articles to show");
      }

      window.scrollTo(0, 0);
    });
  }

  window.scrollTo(0, 0);
}
function findCategoryForTag(tag) {
  const categoryCount = {};

  // Count which categories have this tag
  articlesData.forEach((article) => {
    if (article.tags && article.tags.includes(tag)) {
      const category = normalizeCategory(article.category || "");
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    }
  });

  // Return category with most articles containing this tag
  return Object.keys(categoryCount).reduce(
    (a, b) => (categoryCount[a] > categoryCount[b] ? a : b),
    null
  );
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

  // Hide ALL article cards with this ID
  const allCards = document.querySelectorAll(
    `[data-article-id="${articleId}"]`
  );
  console.log("Found cards to hide:", allCards.length);
  allCards.forEach((card) => {
    card.style.display = "none";
    card.setAttribute("data-hidden-for-view", "true");
  });

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
      populateRelatedCategoryArticles(categoryView, articleId);
      setupCategoryCloseButton();
    }
  } else {
    // Force main view state for random articles
    const categoryPageView = document.getElementById("category-page-view");
    if (categoryPageView) {
      categoryPageView.classList.add("hidden");
      console.log("Hidden category page view");
    }

    const mainContent = document.getElementById("main-content-area");
    if (mainContent) {
      mainContent.style.display = "";
      console.log("Showed main content area");
    }

    const elements = getLayoutElements();
    console.log("Elements found:", elements);

    if (!elements.bentoGrid || !elements.articleView) {
      console.error("Required elements not found", {
        bentoGrid: elements.bentoGrid,
        articleView: elements.articleView,
      });
      return;
    }

    elements.bentoGrid.style.display = "none";
    console.log("Hidden bento grid");

    elements.articleView.classList.remove("hidden");
    console.log("Showed article view");

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
  const mainArticle = container.querySelector(".main-article");

  mainArticle.innerHTML = `
   <article class="reading-layout">
     <header class="article-header">
       <span class="article-category">${
         article.category?.charAt(0).toUpperCase() +
           article.category?.slice(1) || "Uncategorized"
       } | ${formatDate(article.date)} | ${calculateReadingTime(
    article.content
  )}</span>
       <h1 class="article-main-title">${
         article.title || "Untitled Article"
       }</h1>
       <p class="article-hook">${article.hook || "Here comes the hook"}</p>
       
       <div class="social-sharing"></div>
     </header>

    <img 
  src="${article.image || "assets/images/fallback_image.png"}" 
  alt="${article.title || "Article image"}" 
  class="main-article-image"
/>
     
     <div class="article-body">
       ${article.content || createFallbackContent(article)}
     </div>
     
     <footer class="article-footer">
       <div class="article-tags"></div>
     </footer>
   </article>
 `;

  // Add social icons like in the footer
  const socialSharing = mainArticle.querySelector(".social-sharing");
  const socialLinks = [
    {
      social: "x",
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        article.title
      )}&url=${encodeURIComponent(window.location.href)}`,
    },
    {
      social: "tiktok",
      href: `https://www.tiktok.com/`, // TikTok doesn't have direct sharing URLs
    },
    {
      social: "snap",
      href: `https://www.snapchat.com/`, // Snap doesn't have direct sharing URLs
    },
    {
      social: "instagram",
      href: `https://www.instagram.com/`, // Instagram doesn't have direct sharing URLs
    },
    {
      social: "youtube",
      href: `https://www.youtube.com/`, // YouTube doesn't have direct sharing URLs
    },
  ];

  socialLinks.forEach(({ social, href }) => {
    const link = document.createElement("a");
    link.href = href;
    link.className = "social-icon";
    link.setAttribute("data-social", social);
    socialSharing.appendChild(link);
  });

  // Apply icons after adding links, matching footer logic
  const socialIcons = socialSharing.querySelectorAll(".social-icon");
  const socialSvgs = {
    x: xSvg,
    tiktok: tiktokSvg,
    snap: snapSvg,
    instagram: instagramSvg,
    youtube: youtubeSvg,
  };

  socialIcons.forEach((icon) => {
    const social = icon.getAttribute("data-social");
    if (socialSvgs[social]) {
      icon.innerHTML = socialSvgs[social];
    }
  });

  // Populate tags separately
  if (article.tags) {
    const tagsContainer = mainArticle.querySelector(".article-tags");
    populateArticleTags(tagsContainer, article.tags);
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
      const hasResults = checkTagHasResults(tag);
      if (hasResults) {
        tagElement.classList.add("clicked");
        setTimeout(() => {
          searchArticlesByTag(tag);
        }, 250);
      } else {
        showNoTagResultsMessage(tag);
      }
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

  // Show the hidden article card
  const hiddenCard = document.querySelector('[data-hidden-for-view="true"]');
  if (hiddenCard) {
    console.log("Found hidden card to show:", hiddenCard);
    hiddenCard.style.display = "";
    hiddenCard.removeAttribute("data-hidden-for-view");
  } else {
    console.log("No hidden card found");
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

  document.querySelectorAll(".nav-item").forEach((navItem) => {
    navItem.addEventListener("click", handleNavigationClick);
  });

  // Add desktop navigation listeners
  document.querySelectorAll(".desktop-nav-item").forEach((link) => {
    link.addEventListener("click", handleNavigationClick);
  });
}

/**
 * Handles navigation link clicks
 * @param {Event} e - Click event
 */
function handleNavigationClick(e) {
  e.preventDefault();

  // For desktop nav, the currentTarget IS the link
  // For mobile nav, the link is inside the nav-item
  let link, href;

  if (e.currentTarget.classList.contains("desktop-nav-item")) {
    link = e.currentTarget;
    href = link.getAttribute("href");
  } else {
    link = e.currentTarget.querySelector("a");
    href = link.getAttribute("href");
  }

  const isMobileNav = e.currentTarget.closest(".mobile-nav");

  if (href === "#settings") {
    return; // Don't do anything for settings - just let the settings modal handle it
  } else if (href === "#random") {
    exitCategoryPage();
    if (!isMobileNav) {
      updateDesktopNavigation("random");
    }
    loadRandomArticle();
  } else if (href === "#category") {
    return;
  } else if (href === "#latest") {
    exitCategoryPage();
    loadCategory("latest");
  } else {
    const category = href.replace("#", "");
    exitCategoryPage();
    loadCategory(category);
  }
}

function updateDesktopNavigation(currentCategory) {
  // Remove active class from all desktop nav items INCLUDING random
  document
    .querySelectorAll(".desktop-nav-item, .random-btn")
    .forEach((item) => {
      item.classList.remove("active");
    });

  // Add active class to current category
  const activeItem = document.querySelector(
    `.desktop-nav-item[href="#${currentCategory}"]`
  );
  if (activeItem) {
    activeItem.classList.add("active");
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

  const startIndex = daysSinceLaunch * CONFIG.ARTICLES_PER_DAY;

  console.log(
    `Day ${
      daysSinceLaunch + 1
    }: Using articles starting from index ${startIndex}`
  );

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
    // Only keep published articles
    const today = new Date();
    const maxPublishedIndex =
      Math.floor((today - CONFIG.LAUNCH_DATE) / (1000 * 60 * 60 * 24)) *
        CONFIG.ARTICLES_PER_DAY +
      CONFIG.ARTICLES_PER_DAY;
    articlesData = articlesData.slice(0, maxPublishedIndex);

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

  addIcons();
  setupNavigation(); // Move this after addIcons
  // Header hide/show on scroll
  try {
    let lastScrollY = window.scrollY;
    let scrollTimeout;

    window.addEventListener("scroll", () => {
      const header = document.querySelector(".sticky-wrapper-navcontainer");
      const navbar = document.querySelector(".nav-container");
      if (!header) return;

      const currentScrollY = window.scrollY;

      // Add scrolling class (lighter glass)
      header.classList.add("scrolling");
      navbar.classList.add("scrolling");

      // Clear previous timeout
      clearTimeout(scrollTimeout);

      // Remove scrolling class when stopped (darker glass)
      scrollTimeout = setTimeout(() => {
        header.classList.remove("scrolling");
        navbar.classList.remove("scrolling");
      }, 150);

      // Keep existing hide/show logic
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        header.classList.add("hide-header");
      } else if (currentScrollY < lastScrollY) {
        header.classList.remove("hide-header");
      }

      lastScrollY = currentScrollY;
    });
  } catch (error) {
    console.error("Scroll listener error:", error);
  }
}

function addIcons() {
  // Desktop nav icons
  const latest = document.querySelector('.desktop-nav-item[href="#latest"]');
  if (latest) latest.innerHTML = `${latestSvg} Home`;

  const health = document.querySelector('.desktop-nav-item[href="#health"]');
  if (health) health.innerHTML = `${healthSvg} Health`;

  const coins = document.querySelector('.desktop-nav-item[href="#coins"]');
  if (coins) coins.innerHTML = `${coinsSvg} Coins`;

  const hack = document.querySelector('.desktop-nav-item[href="#hack"]');
  if (hack) hack.innerHTML = `${hackSvg} Hack`;

  const ai = document.querySelector('.desktop-nav-item[href="#ai"]');
  if (ai) ai.innerHTML = `${aiSvg} AI`;

  const random = document.querySelector('.desktop-nav-item[href="#random"]');
  if (random) random.innerHTML = `${randomSvg} Random`;

  // Mobile icons
  const mobileLatest = document.querySelector('.nav-item a[href="#latest"]');
  if (mobileLatest) {
    const navItem = mobileLatest.parentElement;
    navItem.innerHTML = `${latestSvg}<a href="#latest"></a>`;
  }

  const mobileCategory = document.querySelector(
    '.nav-item a[href="#category"]'
  );
  if (mobileCategory) {
    const navItem = mobileCategory.parentElement;
    navItem.innerHTML = `${categorySvg}<a href="#category"></a>`;
  }

  const mobileRandom = document.querySelector('.nav-item a[href="#random"]');
  if (mobileRandom) {
    const navItem = mobileRandom.parentElement;
    navItem.innerHTML = `${randomSvg}<a href="#random"></a>`;
  }

  const mobileSettings = document.querySelector(
    '.nav-item a[href="#settings"]'
  );
  if (mobileSettings) {
    const navItem = mobileSettings.parentElement;
    navItem.innerHTML = `${settingsSvg}<a href="#settings"></a>`;
  }

  // Modal icons
  const modalHealth = document.querySelector(
    '.modal-category-item a[href="#health"]'
  );
  if (modalHealth) {
    const modalItem = modalHealth.parentElement;
    modalItem.innerHTML = `<a href="#health">Health</a>`;
  }

  const modalCoins = document.querySelector(
    '.modal-category-item a[href="#coins"]'
  );
  if (modalCoins) {
    const modalItem = modalCoins.parentElement;
    modalItem.innerHTML = `<a href="#coins">Coins</a>`;
  }

  const modalHack = document.querySelector(
    '.modal-category-item a[href="#hack"]'
  );
  if (modalHack) {
    const modalItem = modalHack.parentElement;
    modalItem.innerHTML = `<a href="#hack">Hack</a>`;
  }

  const modalAi = document.querySelector('.modal-category-item a[href="#ai"]');
  if (modalAi) {
    const modalItem = modalAi.parentElement;
    modalItem.innerHTML = `<a href="#ai">AI</a>`;
  }

  // Social icons in footer
  const socialIcons = document.querySelectorAll(".social-icon");
  const socialSvgs = {
    x: xSvg,
    tiktok: tiktokSvg,
    snap: snapSvg,
    instagram: instagramSvg,
    youtube: youtubeSvg,
  };

  socialIcons.forEach((icon) => {
    const social = icon.getAttribute("data-social");
    if (socialSvgs[social]) {
      icon.innerHTML = socialSvgs[social];
    }
  });
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
