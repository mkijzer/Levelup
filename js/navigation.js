// ============================================================================
// navigation.js - NAVIGATION MANAGEMENT
// ============================================================================
// Description: Handles all navigation logic, hash changes, and menu interactions
// Version: 1.1 - Fixed modal conflicts
// ============================================================================

import { loadCategory, loadCategoryPage, loadRandomArticle } from "./data.js";

// ============================================================================
// State Management
// ============================================================================
let currentCategory = "latest";
let isInCategoryPage = false;

// ============================================================================
// Navigation Setup Functions
// ============================================================================

/**
 * Sets up all navigation event listeners
 */
function setupNavigation() {
  // Hash change listener
  window.addEventListener("hashchange", handleHashChange);

  // Mobile navigation
  setupMobileNavigation();

  // Desktop navigation
  setupDesktopNavigation();

  console.log("Navigation: All event listeners setup complete");
}

/**
 * Handle hash changes in URL
 */
function handleHashChange() {
  const hash = window.location.hash.slice(1);
  const category = hash || "latest";

  console.log(`[DEBUG] Hash changed to: ${category}`);

  // Check if coming from search results
  const fromSearch = sessionStorage.getItem("fromSearch") === "true";
  if (fromSearch) {
    console.log("[DEBUG] Skipping hash change due to active search context");
    return;
  }

  // Check if an article view is active
  const articleView = document.querySelector(".article-view");
  if (articleView && !articleView.classList.contains("hidden")) {
    console.log("[DEBUG] Skipping hash change due to active article view");
    return;
  }

  const mainArticleView = document.querySelector(".article-view");
  if (mainArticleView && !mainArticleView.classList.contains("hidden")) {
    mainArticleView.classList.add("hidden");
  }

  const categoryArticleView = document.querySelector(".category-article-view");
  if (
    categoryArticleView &&
    !categoryArticleView.classList.contains("hidden")
  ) {
    categoryArticleView.classList.add("hidden");
  }

  exitCategoryPage();
  loadCategory(category);
}

/**
 * Setup mobile navigation events
 */
function setupMobileNavigation() {
  // FIXED: Exclude category nav item to avoid conflicts with modal.js
  document.querySelectorAll(".nav-item:not(.category)").forEach((navItem) => {
    navItem.addEventListener("click", handleNavigationClick);
  });

  console.log("Navigation: Mobile nav setup complete");
}

/**
 * Setup desktop navigation events
 */
function setupDesktopNavigation() {
  document.querySelectorAll(".desktop-nav-item").forEach((link) => {
    link.addEventListener("click", handleNavigationClick);
  });

  console.log("Navigation: Desktop nav setup complete");
}

/**
 * Handle navigation link clicks
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
    if (!link) return; // Safety check
    href = link.getAttribute("href");
  }

  const isMobileNav = e.currentTarget.closest(".mobile-nav");

  console.log(`Navigation clicked: ${href}`);

  if (href === "#settings") {
    return; // Let settings modal handle this
  } else if (href === "#random") {
    exitCategoryPage();
    if (!isMobileNav) {
      updateDesktopNavigation("random");
    }
    loadRandomArticle();
  } else if (href === "#category") {
    return; // Let category modal handle this
  } else if (href === "#latest") {
    exitCategoryPage();
    loadCategory("latest");
  } else {
    const category = href.replace("#", "");
    exitCategoryPage();
    loadCategory(category);
  }
}

/**
 * Update desktop navigation active state
 */
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

/**
 * Exit category page view and return to main content
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
 * Public function to switch categories from any state
 */
/**
 * Public function to switch categories from any state
 */
function switchToCategory(category) {
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

  // NEW: Import and reset modal after navigation
  import("./modal.js").then((module) => {
    module.resetModalAfterNavigation();
  });
}
// ============================================================================
// State Getters/Setters
// ============================================================================

/**
 * Get current category
 */
function getCurrentCategory() {
  return currentCategory;
}

/**
 * Set current category
 */
function setCurrentCategory(category) {
  currentCategory = category;
}

/**
 * Get category page state
 */
function getIsInCategoryPage() {
  return isInCategoryPage;
}

/**
 * Set category page state
 */
function setIsInCategoryPage(state) {
  isInCategoryPage = state;
}

// ============================================================================
// Export Functions
// ============================================================================
export {
  setupNavigation,
  switchToCategory,
  updateDesktopNavigation,
  exitCategoryPage,
  getCurrentCategory,
  setCurrentCategory,
  getIsInCategoryPage,
  setIsInCategoryPage,
};
