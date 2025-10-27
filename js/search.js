// ============================================================================
// search.js - CLEANED VERSION
// ============================================================================
// Description: Search functionality with debouncing and better UX
// Version: 2.0 - Optimized performance and error handling
// ============================================================================

import { loadCategory, loadSearchResults, loadCategoryPage } from "./data.js";
import { getIsInCategoryPage } from "./navigation.js";

// ============================================================================
// Configuration
// ============================================================================
const SEARCH_DEBOUNCE_DELAY = 300; // ms

// ============================================================================
// State
// ============================================================================
let searchDebounceTimer = null;
let isSearchActive = false;

// ============================================================================
// Main Search Class
// ============================================================================
class SearchManager {
  constructor() {
    this.elements = {};
    this.init();
  }

  init() {
    // Get DOM elements
    this.elements = this.getElements();

    // Check if all required elements exist
    if (!this.validateElements()) {
      console.warn("Search: Required elements not found");
      return;
    }

    this.setupEventListeners();
    console.log("Search: Initialized successfully");
  }

  getElements() {
    return {
      searchIcon: document.querySelector(".search-icon"),
      searchBar: document.querySelector(".search-bar-slide"),
      searchInput: document.getElementById("search-input"),
    };
  }

  validateElements() {
    const { searchIcon, searchBar, searchInput } = this.elements;
    return searchIcon && searchBar && searchInput;
  }

  get isSearchActive() {
    return isSearchActive;
  }

  setupEventListeners() {
    const { searchIcon, searchBar, searchInput } = this.elements;

    // Search icon click - toggle search
    searchIcon.addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggleSearch();
    });

    // Search input handling with debouncing
    searchInput.addEventListener("input", (e) => {
      this.handleSearchInput(e.target.value);
    });

    // Enter key handling
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.handleSearchSubmit();
      }
    });

    // Escape key to close
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && isSearchActive) {
        this.closeSearch();
      }
    });

    // Setup all interaction handlers
    this.setupClickOutside();
    this.setupNavInteractions();
  }

  setupClickOutside() {
    // Use capture phase to catch events before navigation handlers
    document.addEventListener(
      "click",
      (e) => {
        const { searchBar, searchIcon } = this.elements;

        if (!isSearchActive) return;

        // Check if clicked on search elements
        if (searchBar.contains(e.target) || searchIcon.contains(e.target)) {
          return; // Don't close
        }

        // Check if clicked on navigation elements
        const navElement = e.target.closest(
          ".nav-item, .modal-category-item, .desktop-nav-item, .mobile-nav, .desktop-nav, .nav-container"
        );

        if (navElement) {
          this.closeSearch();
          return;
        }

        // Close on any other click outside
        this.closeSearch();
      },
      true
    ); // Use capture phase
  }

  setupNavInteractions() {
    // Additional specific nav handlers with higher priority
    const navItems = document.querySelectorAll(
      ".nav-item, .desktop-nav-item, .modal-category-item"
    );
    navItems.forEach((item) => {
      item.addEventListener(
        "click",
        () => {
          if (isSearchActive) {
            this.closeSearch();
          }
        },
        true
      ); // Use capture phase
    });
  }

  toggleSearch() {
    if (isSearchActive) {
      this.closeSearch();
    } else {
      this.openSearch();
    }
  }

  openSearch() {
    const { searchIcon, searchBar, searchInput } = this.elements;

    searchIcon.classList.add("expanding");
    searchBar.classList.add("active");
    isSearchActive = true;

    // Close settings modal if open
    const settingsModal = document.getElementById("settings-modal");
    if (settingsModal && settingsModal.classList.contains("active")) {
      settingsModal.classList.remove("active");
      const settingsBackdrop = document.getElementById("settings-backdrop");
      if (settingsBackdrop) settingsBackdrop.classList.remove("active");
    }

    // Focus input immediately
    searchInput.focus();
  }

  closeSearch() {
    const { searchIcon, searchBar, searchInput } = this.elements;

    searchBar.classList.remove("active");
    searchIcon.classList.remove("expanding");
    searchInput.value = "";
    searchInput.blur(); // Remove focus
    isSearchActive = false;

    // Clear any pending search
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = null;
    }

    // Return to latest view
    try {
      loadCategory("latest");
    } catch (error) {
      console.error("Search: Error loading latest category:", error);
    }
  }

  closeSearchOnly() {
    const { searchIcon, searchBar, searchInput } = this.elements;

    searchBar.classList.remove("active");
    searchIcon.classList.remove("expanding");
    searchInput.value = "";
    searchInput.blur(); // Remove focus
    isSearchActive = false;

    // Clear any pending search
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = null;
    }
  }

  clearSearch() {
    if (this.elements.searchInput) {
      this.elements.searchInput.value = "";
    }

    this.closeSearch();

    // Clear search results from both views
    const mainSearchResults = document.querySelector(".search-results-grid");
    const categorySearchResults = document.querySelector(
      ".category-search-results"
    );

    if (mainSearchResults) {
      mainSearchResults.style.display = "none";
      mainSearchResults.innerHTML = "";
    }

    if (categorySearchResults) {
      categorySearchResults.style.display = "none";
      categorySearchResults.innerHTML = "";
    }

    // Only reset to latest view if no article is active and not in search context
    const articleView = document.querySelector(".article-view");
    const fromSearch = sessionStorage.getItem("fromSearch") === "true";
    if (
      !articleView ||
      articleView.classList.contains("hidden") ||
      !fromSearch
    ) {
      // Restore appropriate view based on context
      if (getIsInCategoryPage()) {
        const heroGrid = document.querySelector(".category-hero-grid");
        const articlesList = document.querySelector(".category-articles-list");
        const loadMoreBtn = document.querySelector(".load-more-button");

        if (heroGrid) heroGrid.style.display = "";
        if (articlesList) articlesList.style.display = "";
        if (loadMoreBtn) loadMoreBtn.style.display = "";
      } else {
        const bentoGrid = document.querySelector(".bento-grid");
        const latestLabel = document.querySelector(
          ".category-label.latest-label"
        );

        if (bentoGrid) bentoGrid.style.display = "";
        if (latestLabel) latestLabel.style.display = "block";
      }

      // Clear search state
      sessionStorage.removeItem("lastSearch");
    }
  }

  getCurrentContext() {
    return {
      isInCategoryPage: getIsInCategoryPage() || false,
      category: window.currentCategory || "latest",
      isSearchActive: isSearchActive,
    };
  }

  handleSearchInput(query) {
    // Clear existing timer
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
    }

    // Debounce search
    searchDebounceTimer = setTimeout(() => {
      this.performSearch(query);
    }, SEARCH_DEBOUNCE_DELAY);
  }

  handleSearchSubmit() {
    const query = this.elements.searchInput.value.trim();

    // Clear debounce timer for immediate search
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = null;
    }

    // Reset any open article views first
    const articleView = document.querySelector(".article-view");
    if (articleView && !articleView.classList.contains("hidden")) {
      articleView.classList.add("hidden");
    }

    this.performSearch(query);
  }

  performSearch(query) {
    const trimmedQuery = query.trim();
    const context = this.getCurrentContext();

    try {
      if (trimmedQuery.length > 0) {
        // Store search state in sessionStorage
        sessionStorage.setItem("fromSearch", "true");

        // Pass the current context to loadSearchResults
        loadSearchResults(trimmedQuery, context);
      } else {
        // Clear search state
        sessionStorage.removeItem("fromSearch");

        // Return to appropriate view based on context
        if (context.isInCategoryPage) {
          loadCategoryPage(context.category);
        } else {
          loadCategory("latest");
        }
      }
    } catch (error) {
      console.error("Search: Error performing search:", error);
    }
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const desktopSearchIcon = document.querySelector(".desktop-search-icon");
  const searchBar = document.querySelector(".search-bar-slide");

  if (desktopSearchIcon && searchBar) {
    desktopSearchIcon.addEventListener("click", function () {
      searchBar.classList.toggle("active");
      desktopSearchIcon.classList.toggle("active");
    });
  }
});

// ============================================================================
// Initialization
// ============================================================================
let searchManager = null;

function initializeSearch() {
  if (!searchManager) {
    searchManager = new SearchManager();
    // Make it globally available
    window.searchManager = searchManager;
  }
}

// Auto-initialize when DOM is ready
document.addEventListener("DOMContentLoaded", initializeSearch);

// Export for manual initialization if needed
export { initializeSearch, searchManager, isSearchActive };
