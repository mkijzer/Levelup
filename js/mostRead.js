import { articlesData } from "./articleLoader.js";
import { formatDate, calculateReadingTime } from "./utils.js";

export function populateMostRead() {
  const mostReadGrid = document.querySelector(".most-read-grid");
  if (!mostReadGrid || articlesData.length === 0) return;

  // Get today's date as a string (YYYY-MM-DD)
  const today = new Date().toISOString().split("T")[0];

  // Check if we have cached articles for today
  const cachedData = localStorage.getItem("mostReadCache");
  let selectedArticles;

  if (cachedData) {
    const cache = JSON.parse(cachedData);

    // If cache is from today, use cached article IDs
    if (cache.date === today) {
      selectedArticles = cache.articleIds
        .map((id) => articlesData.find((article) => article.id === id))
        .filter(Boolean); // Remove any articles that no longer exist
    }
  }

  // If no valid cache, generate new selection
  if (!selectedArticles || selectedArticles.length < 5) {
    const shuffled = [...articlesData].sort(() => Math.random() - 0.5);
    selectedArticles = shuffled.slice(0, 5);

    // Cache the selection for today
    localStorage.setItem(
      "mostReadCache",
      JSON.stringify({
        date: today,
        articleIds: selectedArticles.map((article) => article.id),
      })
    );
  }

  const mostReadCards = mostReadGrid.querySelectorAll(".most-read-card");

  selectedArticles.forEach((article, index) => {
    if (mostReadCards[index]) {
      populateMostReadCard(mostReadCards[index], article);
    }
  });
}

function populateMostReadCard(card, article) {
  const title = card.querySelector(".most-read-title");
  const meta = card.querySelector(".most-read-meta");
  const image = card.querySelector(".most-read-image");

  if (title) title.textContent = article.title || "Untitled Article";
  if (meta) {
    const readingTime = calculateReadingTime(article.content);
    meta.textContent = `${formatDate(article.date)} | ${readingTime}`;
  }
  if (image) {
    const imageUrl =
      article.inline_image ||
      article.image ||
      "assets/images/fallback_image.png";
    image.src = imageUrl;
    image.alt = article.title || "Article image";
  }

  card.setAttribute("data-article-id", article.id);
}

export function refreshMostRead() {
  populateMostRead();
}

// Animation control functionality
export function initAnimationControls() {
  const toggleButton = document.getElementById("most-read-toggle");
  const grid = document.querySelector(".most-read-grid");
  const playIcon = toggleButton?.querySelector(".play-icon");
  const pauseIcon = toggleButton?.querySelector(".pause-icon");

  let isPaused = false;

  toggleButton?.addEventListener("click", () => {
    isPaused = !isPaused;

    if (isPaused) {
      grid.classList.add("paused");
      playIcon.classList.remove("hidden");
      pauseIcon.classList.add("hidden");
      toggleButton.setAttribute("aria-label", "Play animation");
    } else {
      grid.classList.remove("paused");
      playIcon.classList.add("hidden");
      pauseIcon.classList.remove("hidden");
      toggleButton.setAttribute("aria-label", "Pause animation");
    }
  });
}

// Initialize controls after populating
initAnimationControls();
