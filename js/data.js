// ============================================================================
// data.js - MAIN COORDINATOR
// ============================================================================
// Description: Main coordinator for the application, handles initialization and coordination
// Version: 4.2 - Complete modal fix with proper initialization
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

import { normalizeCategory } from "./utils.js";

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

import { createArticleCard } from "./articleCards.js";

import { populateMostRead } from "./mostRead.js";

import { populateMobileCarousel } from "./mobileCarousel.js";

import { initializeQuotes } from "./quotes.js";

import { initializeScrollAnimations } from "./scroll-animations.js";

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

  // Clear search state
  sessionStorage.removeItem("fromSearch");

  // Hide any open search results
  const searchResults = document.querySelector(".search-results-grid");
  if (searchResults) {
    searchResults.style.display = "none";
  }
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
  // Force back to main view state first
  setIsInCategoryPage(false);

  // Reset any existing article views
  const articleView = document.querySelector(".article-view");
  if (articleView && !articleView.classList.contains("hidden")) {
    articleView.classList.add("hidden");
  }

  const elements = getLayoutElements();
  if (!elements.bentoGrid) return;

  // Hide category page if it's showing
  const categoryPageView = document.getElementById("category-page-view");
  if (categoryPageView) {
    categoryPageView.classList.add("hidden");
  }

  // Show main content area
  const mainContent = document.getElementById("main-content-area");
  if (mainContent) {
    mainContent.style.display = "";
  }

  // Hide bento grid
  elements.bentoGrid.style.display = "none";

  // Get or create search results container
  let searchContainer = document.querySelector(".search-results-grid");
  if (!searchContainer) {
    searchContainer = document.createElement("div");
    searchContainer.className = "category-grid search-results-grid";
    elements.bentoGrid.parentNode.insertBefore(
      searchContainer,
      elements.bentoGrid.nextSibling
    );
  }

  // Clear existing search results
  searchContainer.innerHTML = "";
  // Make sure it's visible
  searchContainer.style.display = "";

  updateCategoryTitle(`SEARCH: ${query.toUpperCase()}`);

  const allSearchResults = searchArticles(query);

  // Store all results but only show first 20
  searchContainer.setAttribute(
    "data-all-results",
    JSON.stringify(allSearchResults.map((a) => a.id))
  );
  searchContainer.setAttribute("data-current-page", "1");

  // Show a message if no results found
  if (allSearchResults.length === 0) {
    searchContainer.innerHTML =
      '<p class="no-results">No articles found matching your search.</p>';
  } else {
    // Important: Mark that we're in search mode in session storage
    sessionStorage.setItem("fromSearch", "true");

    // Create cards for first 20 search results
    const initialResults = allSearchResults.slice(0, 20);
    for (const article of initialResults) {
      const card = await createArticleCard(article, "small");
      card.setAttribute("data-from-search", "true");
      searchContainer.appendChild(card);
    }

    // Add "Load More" button if there are more results
    if (allSearchResults.length > 20) {
      const loadMoreButton = document.createElement("button");
      loadMoreButton.className = "load-more-button";
      loadMoreButton.textContent = "Load More Results";
      loadMoreButton.addEventListener("click", loadMoreSearchResults);
      searchContainer.after(loadMoreButton);
    }
  }
}

// New function to load more search results
async function loadMoreSearchResults() {
  const searchContainer = document.querySelector(".search-results-grid");
  const loadMoreButton = document.querySelector(".load-more-button");

  if (!searchContainer || !loadMoreButton) return;

  // Get stored article IDs and current page
  const allResultIds = JSON.parse(
    searchContainer.getAttribute("data-all-results") || "[]"
  );
  const currentPage = parseInt(
    searchContainer.getAttribute("data-current-page") || "1"
  );
  const nextPage = currentPage + 1;

  // Calculate which results to show next
  const startIndex = currentPage * 20;
  const endIndex = startIndex + 20;

  // Get the article objects for these IDs
  const nextResults = allResultIds
    .slice(startIndex, endIndex)
    .map((id) => articlesData.find((article) => article.id === id))
    .filter((article) => article); // Remove any undefined entries

  // Add the next batch of results
  for (const article of nextResults) {
    const card = await createArticleCard(article, "small");
    card.setAttribute("data-from-search", "true");
    searchContainer.appendChild(card);
  }

  // Update current page
  searchContainer.setAttribute("data-current-page", nextPage.toString());

  // Remove the button if we've loaded all results
  if (endIndex >= allResultIds.length) {
    loadMoreButton.remove();
  }
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

  // Clear any search state
  sessionStorage.removeItem("fromSearch");

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
  // FIXED: Don't hide main content (this was causing header to disappear)
  // elements.mainContent.style.display = "none"; // REMOVED THIS LINE
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
  // Remove any existing event listeners first
  const container = document.querySelector(".container");
  const categoryPageView = document.getElementById("category-page-view");

  if (container) {
    container.addEventListener("click", handleArticleCardClick);
  }

  if (categoryPageView) {
    categoryPageView.addEventListener("click", handleArticleCardClick);
  }
}

function handleArticleCardClick(e) {
  const card = e.target.closest(".article-card");
  if (card && card.getAttribute("data-article-id")) {
    const articleId = card.getAttribute("data-article-id");
    e.preventDefault(); // Prevent default navigation

    console.log(`[DEBUG] Clicked article ID: ${articleId}`);
    console.log(
      `[DEBUG] Is from search: ${
        card.getAttribute("data-from-search") === "true" ||
        !!e.target.closest(".search-results-grid")
      }`
    );

    // Check if this is a search result card either by container or data attribute
    const isFromSearch =
      card.getAttribute("data-from-search") === "true" ||
      !!e.target.closest(".search-results-grid");

    if (isFromSearch) {
      console.log("[DEBUG] Setting fromSearch flag for search result click");
      sessionStorage.setItem("fromSearch", "true");
    }

    console.log("[DEBUG] Calling showArticleView with articleId:", articleId);

    // Close search if open
    if (
      window.searchManager &&
      typeof window.searchManager.closeSearch === "function"
    ) {
      window.searchManager.closeSearch();
    }
    // Directly call showArticleView with no other state changes
    showArticleView(articleId);

    // Close search if open
    const searchBar = document.querySelector(".search-bar-slide");
    const searchIcon = document.querySelector(".search-icon");
    const searchInput = document.getElementById("search-input");

    if (searchBar && searchBar.classList.contains("active")) {
      searchBar.classList.remove("active");
      searchIcon.classList.remove("expanding");
      searchInput.value = "";
    }
  } else {
    console.log("[DEBUG] No valid article card clicked");
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
    // FIXED: Preserve the category class when adding icons
    navItem.innerHTML = `${categorySvg}<a href="#category"></a>`;
    navItem.classList.add("category"); // Re-add the category class
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

setTimeout(() => {
  import("./modal.js").then((module) => module.initializeModal());
}, 100);

// ============================================================================
// Initialization
// ============================================================================

/**
 * Main application initialization function
 */
async function initializeApp() {
  try {
    console.log("Initializing application...");

    const dataLoaded = await initializeArticleData();
    if (!dataLoaded) {
      const errorDiv = document.createElement("div");
      errorDiv.className = "error-message";
      errorDiv.textContent =
        "Failed to load articles. Please refresh the page.";
      document.body.appendChild(errorDiv);
      return;
    }

    await initializeQuotes();

    // Setup all systems
    setupEventDelegation();
    await populateCategoryGrids();
    setupNavigation();
    initializeScrollAnimations();
    addIcons();

    // FIXED: Reinitialize modal after icons are added to attach to new DOM elements
    await import("./modal.js").then((module) => {
      module.initializeModal();
    });

    populateMostRead();
    populateMobileCarousel();

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
    // Only apply scroll behavior on mobile and tablet, not desktop
    if (window.innerWidth >= 1200) {
      return;
    }

    let lastScrollY = window.scrollY;
    let scrollTimeout;
    let touchTimeout;

    // Function to show header when scrolling/touching stops
    const showHeaderAfterDelay = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const header = document.querySelector(".sticky-wrapper-navcontainer");
        if (header) {
          header.classList.remove("hide-header");
          header.classList.remove("scrolling");
          const navbar = document.querySelector(".nav-container");
          if (navbar) navbar.classList.remove("scrolling");
        }
      }, 500);
    };

    window.addEventListener("scroll", () => {
      const header = document.querySelector(".sticky-wrapper-navcontainer");
      const navbar = document.querySelector(".nav-container");
      if (!header) return;

      const currentScrollY = window.scrollY;

      // Add scrolling class (lighter glass)
      header.classList.add("scrolling");
      if (navbar) navbar.classList.add("scrolling");

      // Hide header when scrolling down, show only when scrolling up
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        header.classList.add("hide-header");
      }
      // Only show when actively scrolling up
      else if (currentScrollY < lastScrollY) {
        header.classList.remove("hide-header");
      }

      lastScrollY = currentScrollY;
    });

    // Add touchend listener to show header when touch ends
    window.addEventListener("touchend", () => {
      clearTimeout(touchTimeout);
      touchTimeout = setTimeout(() => {
        const header = document.querySelector(".sticky-wrapper-navcontainer");
        if (header) {
          header.classList.remove("hide-header");
        }
      }, 500);
    });
  } catch (error) {
    console.error("Scroll listener error:", error);
  }
}

// Auto-initialize when DOM is ready
document.addEventListener("DOMContentLoaded", initializeApp);
// Export for backwards compatibility and external access
export { switchToCategory, showArticleView };

// Expose for modal
window.loadCategory = loadCategory;
window.loadCategoryPage = loadCategoryPage;
window.switchToCategory = switchToCategory; // already imported from navigation.js
window.switchToCategory = switchToCategory;

// Now modal.js can call window.loadCategory(category) safely
