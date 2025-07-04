// ============================================================================
// search.js
// ============================================================================
// Description: Search functionality for the SPA
// Version: 1.0
// Author: [Mike]
// ============================================================================

import { loadCategory, loadSearchResults } from "./data.js";

/**
 * Initializes search functionality
 */
function initializeSearch() {
  const searchIcon = document.querySelector(".search-icon");
  const searchBar = document.querySelector(".search-bar-slide");
  const searchInput = document.getElementById("search-input");

  if (!searchIcon || !searchBar || !searchInput) return;

  // Toggle search bar
  searchIcon.addEventListener("click", (e) => {
    e.stopPropagation();
    const isActive = searchBar.classList.contains("active");
    if (isActive) {
      closeSearch();
    } else {
      openSearch();
    }
  });

  // Open search function
  function openSearch() {
    searchIcon.classList.add("expanding");
    searchBar.classList.add("active");
    setTimeout(() => searchInput.focus(), 400);
  }

  // Close search function
  function closeSearch() {
    searchBar.classList.remove("active");
    searchIcon.classList.remove("expanding");
    searchInput.value = "";
    // Load latest when closing search
    loadCategory("latest");
  }

  // Close when clicking outside
  document.addEventListener("click", (e) => {
    if (!searchBar.contains(e.target) && !searchIcon.contains(e.target)) {
      closeSearch();
    }
  });

  // Handle search input
  searchInput.addEventListener("input", (e) => {
    const query = e.target.value;
    if (query.length > 0) {
      loadSearchResults(query);
    } else {
      loadCategory("latest");
    }
  });

  // Handle Enter key
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      const query = searchInput.value.trim();
      if (query) {
        loadSearchResults(query);
      }
    }
  });
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", initializeSearch);
