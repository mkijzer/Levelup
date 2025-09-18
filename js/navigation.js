// ============================================================================
// navigation.js - NAVIGATION & ROUTING
// ============================================================================
// Description: Handles navigation logic and routing - NO modal responsibilities
// Version: 2.0 - Clean separation of concerns
// ============================================================================

import { loadCategory, loadCategoryPage, loadRandomArticle } from "./data.js";

// ============================================================================
// Navigation State
// ============================================================================
let currentCategory = "latest";
let isInCategoryPage = false;

// ============================================================================
// Public State Functions
// ============================================================================
export function getCurrentCategory() {
  return currentCategory;
}

export function setCurrentCategory(category) {
  currentCategory = category;
}

export function getIsInCategoryPage() {
  return isInCategoryPage;
}

export function setIsInCategoryPage(state) {
  isInCategoryPage = state;
}

// ============================================================================
// Navigation Setup
// ============================================================================
export function setupNavigation() {
  // Hash change listener
  window.addEventListener("hashchange", handleHashChange);

  // Mobile navigation (excluding category button - handled by modal.js)
  document.querySelectorAll(".nav-item:not(.category)").forEach((navItem) => {
    navItem.addEventListener("click", handleNavigationClick);
  });

  // Desktop navigation
  document.querySelectorAll(".desktop-nav-item").forEach((link) => {
    link.addEventListener("click", handleNavigationClick);
  });

  console.log("Navigation: Setup complete");
}

// ============================================================================
// Event Handlers
// ============================================================================
function handleHashChange() {
  const hash = window.location.hash.slice(1);
  const category = hash || "latest";

  // Skip if search is active
  if (sessionStorage.getItem("fromSearch") === "true") {
    return;
  }

  // Skip if article view is open
  const articleView = document.querySelector(".article-view");
  if (articleView && !articleView.classList.contains("hidden")) {
    return;
  }

  exitCategoryPage();
  loadCategory(category);
}

function handleNavigationClick(e) {
  e.preventDefault();

  // Get href from clicked element
  let href;
  if (e.currentTarget.classList.contains("desktop-nav-item")) {
    href = e.currentTarget.getAttribute("href");
  } else {
    const link = e.currentTarget.querySelector("a");
    if (!link) return;
    href = link.getAttribute("href");
  }

  const isMobileNav = e.currentTarget.closest(".mobile-nav");

  // Route to appropriate handler
  if (href === "#settings") {
    return; // Let settings modal handle this
  } else if (href === "#category") {
    return; // Let modal.js handle this
  } else if (href === "#random") {
    exitCategoryPage();
    if (!isMobileNav) {
      updateDesktopNavigation("random");
    }
    loadRandomArticle();
  } else if (href === "#latest") {
    exitCategoryPage();
    loadCategory("latest");
  } else {
    const category = href.replace("#", "");
    exitCategoryPage();
    loadCategory(category);
  }
}

// ============================================================================
// Category Management
// ============================================================================
export function switchToCategory(category) {
  isInCategoryPage = false;

  // Hide any open article views
  const mainArticleView = document.querySelector(".article-view");
  if (mainArticleView) {
    mainArticleView.classList.add("hidden");
  }

  const categoryArticleView = document.querySelector(".category-article-view");
  if (categoryArticleView) {
    categoryArticleView.classList.add("hidden");
  }

  // Show category page elements
  const heroGrid = document.querySelector(".category-hero-grid");
  const articlesList = document.querySelector(".category-articles-list");
  const loadMoreBtn = document.querySelector(".load-more-button");

  if (heroGrid) heroGrid.style.display = "";
  if (articlesList) articlesList.style.display = "";
  if (loadMoreBtn) loadMoreBtn.style.display = "";

  loadCategoryPage(category);
}

export function exitCategoryPage() {
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

export function updateDesktopNavigation(currentCategory) {
  // Remove active class from all items
  document
    .querySelectorAll(".desktop-nav-item, .random-btn")
    .forEach((item) => {
      item.classList.remove("active");
    });

  // Add active class to current category
  const activeItem = document.querySelector(`[href="#${currentCategory}"]`);
  if (activeItem) {
    activeItem.classList.add("active");
  }
}
