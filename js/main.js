// main.js

document.addEventListener("DOMContentLoaded", () => {
  // Fetch articles from articles.json
  fetch("data/articles.json")
    .then((response) => response.json())
    .then((articles) => {
      // Function to load a random article
      function loadRandomArticle() {
        const randomIndex = Math.floor(Math.random() * articles.length);
        const randomArticle = articles[randomIndex];
        window.location.href = `#${randomArticle.slug}`;
      }

      // Random button in nav
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
