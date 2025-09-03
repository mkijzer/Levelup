// ============================================================================
// data.js - MAIN COORDINATOR
// ============================================================================
// Description: Main coordinator for the application, handles initialization and coordination
// Version: 4.0 - Cleaned up and split into modules
// ============================================================================

import {
  initializeArticleData,
  getArticlesByCategory,
  getAllCategoryArticles,
  searchArticles,
  populateMainLayout,
  populateCategoryHero,
  populateCategoryList,
  populateCategoryGrids,
  articlesData,
} from "./articleLoader.js";

import {
  setupNavigation,
  updateDesktopNavigation,
  getCurrentCategory,
  setCurrentCategory,
  getIsInCategoryPage,
  setIsInCategoryPage,
  switchToCategory,
} from "./navigation.js";

import { showArticleView, getRandomArticle } from "./articleView.js";

import {
  resetLoadMoreButton,
  setupCategoryPageInteractions,
} from "./categoryManager.js";

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
// DOM Element Getters
// ============================================================================

/**
 * Gets main layout elements for content display
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
// Main Category Loading Functions
// ============================================================================

/**
 * Loads articles for a specific category in main view
 */
export async function loadCategory(category) {
  setCurrentCategory(category);
  setIsInCategoryPage(false);
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
 */
export async function loadCategoryPage(category) {
  setCurrentCategory(category);
  setIsInCategoryPage(true);

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

  setupCategoryPageInteractions();

  // Scroll the category page view to top
  const categoryPageView = document.getElementById("category-page-view");
  if (categoryPageView) {
    categoryPageView.scrollTop = 0;
  }
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
// UI State Management
// ============================================================================

/**
 * Resets main view state to show bento grid
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
 */
function showCategoryPageView(elements, category) {
  elements.mainContent.style.display = "none";
  elements.categoryPageView.classList.remove("hidden");

  if (elements.categoryTitle) {
    elements.categoryTitle.textContent =
      category.charAt(0).toUpperCase() + category.slice(1);
  }
}

// ============================================================================
// Event Setup Functions
// ============================================================================

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
 */
function handleArticleCardClick(e) {
  const card = e.target.closest(".article-card");
  if (card && card.getAttribute("data-article-id")) {
    const articleId = card.getAttribute("data-article-id");
    console.log(`Clicked article: ${articleId}`);
    showArticleView(articleId);
  }
}

// ============================================================================
// Icon Setup
// ============================================================================

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

// ============================================================================
// Initialization
// ============================================================================

/**
 * Main application initialization function
 */
async function initializeApp() {
  try {
    console.log("Initializing application...");

    // Initialize article data
    const dataLoaded = await initializeArticleData();
    if (!dataLoaded) {
      throw new Error("Failed to load article data");
    }

    // Setup all systems
    setupEventDelegation();
    await populateCategoryGrids();
    setupNavigation();
    addIcons();

    // Load initial category
    loadCategory("latest");

    console.log("Application initialized successfully");
  } catch (error) {
    console.error("Error initializing application:", error);
  }

  // Header hide/show on scroll
  setupScrollBehavior();
}

/**
 * Setup scroll behavior for header
 */
function setupScrollBehavior() {
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

// Auto-initialize when DOM is ready
document.addEventListener("DOMContentLoaded", initializeApp);
// Export for backwards compatibility and external access
export {
  // loadCategory,
  // loadSearchResults,
  // loadCategoryPage,
  // loadRandomArticle,
  switchToCategory,
  showArticleView,
};
