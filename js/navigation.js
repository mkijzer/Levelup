// ============================================================================
// navigation.js - NAVIGATION & ROUTING
// ============================================================================
// Description: Handles navigation logic and routing - NO modal responsibilities
// Version: 2.1 - Added mobile navigation active states
// ============================================================================

import { loadCategory, loadCategoryPage, loadRandomArticle } from "./data.js";

// ============================================================================
// Navigation State
// ============================================================================
let currentCategory = "latest";
let isInCategoryPage = true;

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
  document.querySelectorAll(".nav-item").forEach((navItem) => {
    navItem.addEventListener("click", handleNavigationClick);
  });

  // Desktop navigation
  document.querySelectorAll(".desktop-nav-item").forEach((link) => {
    link.addEventListener("click", handleNavigationClick);
  });

  // Set initial active state
  updateMobileNavigation("latest");

  console.log("Navigation: Setup complete");
}

// Set initial active state for home/latest
updateMobileNavigation("latest");

// ============================================================================
// Event Handlers
// ============================================================================
function handleHashChange() {
  const hash = window.location.hash.slice(1);
  const category = hash || "latest";

  // Clear search state when navigating
  sessionStorage.removeItem("fromSearch");

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
    updateMobileNavigation("random");

    // Add flash animation
    const randomNavItem = document
      .querySelector('.nav-item a[href="#random"]')
      ?.closest(".nav-item");
    if (randomNavItem) {
      randomNavItem.setAttribute("data-random-clicked", "true");
      setTimeout(() => {
        randomNavItem.removeAttribute("data-random-clicked");
      }, 600);
    }

    if (!isMobileNav) {
      updateDesktopNavigation("random");
    }
    loadRandomArticle();
  } else if (href === "#latest") {
    exitCategoryPage();
    updateMobileNavigation("latest");
    loadCategory("latest");
  } else {
    const category = href.replace("#", "");
    exitCategoryPage();
    updateMobileNavigation(category);
    loadCategory(category);
  }
}

// ============================================================================
// Navigation Active States
// ============================================================================

/**
 * Update mobile navigation active state
 */
export function updateMobileNavigation(currentCategory) {
  // Remove active class from all mobile nav items
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.remove("active");
  });

  // Add active class to current category
  if (currentCategory === "latest") {
    const latestItem = document.querySelector('.nav-item a[href="#latest"]');
    if (latestItem) latestItem.closest(".nav-item").classList.add("active");
  } else if (currentCategory === "random") {
    const randomItem = document.querySelector('.nav-item a[href="#random"]');
    if (randomItem) randomItem.closest(".nav-item").classList.add("active");
  } else if (["health", "coins", "hack", "ai"].includes(currentCategory)) {
    const categoryItem = document.querySelector(".nav-item.category");
    if (categoryItem) categoryItem.classList.add("active");
  }
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

  // Update mobile nav active state
  updateMobileNavigation(category);

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
