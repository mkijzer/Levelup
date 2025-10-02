// ============================================================================
// mostRead.js - ANIMATED MOST READ SECTION
// ============================================================================

import { articlesData } from "./articleLoader.js";
import { formatDate, calculateReadingTime } from "./utils.js";

let rotationTimer;
let currentPositions = [1, 2, 3, 4, 5];

export function populateMostRead() {
  const mostReadGrid = document.querySelector(".most-read-grid");
  if (!mostReadGrid || articlesData.length === 0) return;

  const shuffled = [...articlesData].sort(() => Math.random() - 0.5);
  const selectedArticles = shuffled.slice(0, 5);
  const mostReadCards = mostReadGrid.querySelectorAll(".most-read-card");

  selectedArticles.forEach((article, index) => {
    if (mostReadCards[index]) {
      populateMostReadCard(mostReadCards[index], article);
      mostReadCards[index].classList.add(`position-${currentPositions[index]}`);
    }
  });

  startRotation();
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

function startRotation() {
  if (rotationTimer) clearInterval(rotationTimer);

  rotationTimer = setInterval(() => {
    const cards = document.querySelectorAll(".most-read-card");

    // Remove all position classes
    cards.forEach((card) => {
      for (let i = 1; i <= 5; i++) {
        card.classList.remove(`position-${i}`);
      }
    });

    // Rotate positions array
    currentPositions.unshift(currentPositions.pop());

    // Apply new position classes
    cards.forEach((card, index) => {
      card.classList.add(`position-${currentPositions[index]}`);
    });
  }, 3000);
}

export function refreshMostRead() {
  populateMostRead();
}
