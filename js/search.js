// ============================================================================
// search.js - CLEANED VERSION
// ============================================================================
// Description: Search functionality with debouncing and better UX
// Version: 2.0 - Optimized performance and error handling
// ============================================================================

import { loadCategory, loadSearchResults } from "./data.js";

// ============================================================================
// Configuration
// ============================================================================
const SEARCH_DEBOUNCE_DELAY = 300; // ms
const FOCUS_DELAY = 400; // ms

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

  setupEventListeners() {
    const { searchIcon, searchBar, searchInput } = this.elements;

    // Search icon click
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

    // Click outside to close
    this.setupClickOutside();

    // Escape key to close
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && isSearchActive) {
        this.closeSearch();
      }
    });
  }

  setupClickOutside() {
    const { searchBar, searchIcon } = this.elements;

    document.addEventListener("click", (e) => {
      if (
        isSearchActive &&
        !searchBar.contains(e.target) &&
        !searchIcon.contains(e.target)
      ) {
        this.closeSearch();
      }
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

    // Focus input after animation
    setTimeout(() => {
      if (isSearchActive) {
        searchInput.focus();
      }
    }, FOCUS_DELAY);
  }

  closeSearch() {
    const { searchIcon, searchBar, searchInput } = this.elements;

    searchBar.classList.remove("active");
    searchIcon.classList.remove("expanding");
    searchInput.value = "";
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

    this.performSearch(query);
  }

  performSearch(query) {
    const trimmedQuery = query.trim();

    try {
      if (trimmedQuery.length > 0) {
        loadSearchResults(trimmedQuery);
      } else {
        loadCategory("latest");
      }
    } catch (error) {
      console.error("Search: Error performing search:", error);
    }
  }
}

// ============================================================================
// Initialization
// ============================================================================
let searchManager = null;

function initializeSearch() {
  if (!searchManager) {
    searchManager = new SearchManager();
  }
}

// Auto-initialize when DOM is ready
document.addEventListener("DOMContentLoaded", initializeSearch);

// Export for manual initialization if needed
export { initializeSearch };
