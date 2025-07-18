// ============================================================================
// articleCards.js - CLEANED VERSION
// ============================================================================
// Description: Article card creation and population
// Version: 2.0 - Fixed circular import and optimized
// ============================================================================

import { normalizeCategory, formatDate } from "./utils.js";

// ============================================================================
// Shared Observer for Performance
// ============================================================================
let imageObserver = null;

function getImageObserver() {
  if (!imageObserver) {
    imageObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            const card = img.closest(".article-card");

            img.src = img.dataset.src;
            img.addEventListener(
              "load",
              () => {
                if (card) card.classList.remove("loading");
              },
              { once: true }
            );

            imageObserver.unobserve(img);
          }
        });
      },
      { rootMargin: "100px" }
    );
  }
  return imageObserver;
}

// ============================================================================
// Card Creation
// ============================================================================

/**
 * Creates a new article card element
 */
export async function createArticleCard(
  article,
  type = "small",
  isSideBySide = false
) {
  const card = document.createElement("div");
  card.classList.add("article-card", "glass", type, "loading");
  if (isSideBySide) card.classList.add("side-by-side");

  // Set data attributes
  card.setAttribute("data-article-id", article.id || "");
  card.setAttribute("data-category", normalizeCategory(article.category || ""));

  // Create HTML structure
  card.innerHTML = createCardHTML(type);

  // Populate with data
  populateCardContent(card, article);

  // Setup lazy loading
  setupLazyLoading(card);

  return card;
}

/**
 * Populates an existing card with article data
 */
export async function populateArticleCard(card, article) {
  if (!card || !article) return;

  // Update attributes
  card.setAttribute("data-article-id", article.id || "");
  card.setAttribute("data-category", normalizeCategory(article.category || ""));
  card.classList.add("loading");

  // Populate content
  populateCardContent(card, article);

  // Setup lazy loading
  setupLazyLoading(card);
}

// ============================================================================
// Helper Functions
// ============================================================================

function createCardHTML(type) {
  if (type === "huge") {
    return `
      <div class="card-inner">
        <div class="article-image-wrapper">
          <img src="assets/images/placeholder.jpg" alt="" class="article-image" loading="lazy" />
          <div class="gradient-overlay"></div>
          <div class="article-content">
            <h2 class="article-title"></h2>
          </div>
        </div>
      </div>
    `;
  } else {
    return `
      <div class="card-inner">
        <div class="article-image-wrapper">
          <img src="assets/images/placeholder.jpg" alt="" class="article-image" loading="lazy" />
        </div>
        <div class="article-content">
          <p class="article-meta"></p>
          <h2 class="article-title"></h2>
        </div>
      </div>
    `;
  }
}

function populateCardContent(card, article) {
  const img = card.querySelector(".article-image");
  const title = card.querySelector(".article-title");
  const meta = card.querySelector(".article-meta");

  if (img) {
    img.dataset.src = article.image || "assets/images/fallback_image.png";
    img.alt = article.title || "Article Image";
  }

  if (title) {
    title.textContent = article.title || "Untitled Article";
  }

  if (meta) {
    meta.textContent = `${formatDate(article.date)} | ${article.category}`;
  }
}

function setupLazyLoading(card) {
  const img = card.querySelector(".article-image");
  if (img && img.dataset.src) {
    getImageObserver().observe(img);
  }
}
