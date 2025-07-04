// ============================================================================
// main.js
// ============================================================================
// Description: Handles random article navigation for desktop and mobile.
// Version: 1.0
// Author: [Your Name]
// ============================================================================

// ============================================================================
// Random Article Navigation
// ============================================================================

/**
 * Sets up event listeners for random article buttons on DOM content load.
 */
document.addEventListener("DOMContentLoaded", () => {
  // Fetch articles from articles.json
  fetch("data/articles.json")
    .then((response) => response.json())
    .then((articles) => {
      /**
       * Loads a random article by updating the URL hash with its slug.
       */
      function loadRandomArticle() {
        const randomIndex = Math.floor(Math.random() * articles.length);
        const randomArticle = articles[randomIndex];
        window.location.href = `#${randomArticle.slug}`;
      }

      // Random button in main navigation
      const randomButton = document.getElementById("random-button");
      if (randomButton) {
        randomButton.addEventListener("click", loadRandomArticle);
      }

      // Random button in mobile menu
      const mobileRandomButton = document.getElementById(
        "mobile-random-button"
      );
      if (mobileRandomButton) {
        mobileRandomButton.addEventListener("click", loadRandomArticle);
      }

      // Next button in article view
      const nextButton = document.querySelector(".next-button");
      if (nextButton) {
        nextButton.addEventListener("click", loadRandomArticle);
      }
    })
    .catch((error) => console.error("Error loading articles:", error));
});
