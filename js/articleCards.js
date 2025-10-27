// ============================================================================
// articleCards.js - CLEANED VERSION
// ============================================================================
// Description: Article card creation and population
// Version: 2.0 - Fixed circular import and optimized
// ============================================================================

import {
  normalizeCategory,
  formatDate,
  calculateReadingTime,
  extractAltFromFilename,
} from "./utils.js";

import { SEO } from "./seo.js";

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

            img.decoding = "async";
            img.src = img.dataset.src;
            img.addEventListener(
              "load",
              () => {
                if (card) card.classList.remove("loading");
              },
              { once: true }
            );
            img.addEventListener(
              "error",
              () => {
                img.decoding = "async";
                img.src = "assets/images/fallback_image.png";
                if (card) card.classList.remove("loading");
              },
              { once: true }
            );
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

  // Remove loading class immediately
  card.classList.remove("loading");
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

  // Setup image
  if (img) {
    img.dataset.src = article.image || "assets/images/fallback_image.png";
    img.dataset.populated = "true";
    img.alt =
      extractAltFromFilename(article.image) || article.title || "Article Image";
  }

  // Setup text content with skeleton loading
  if (title) {
    showSkeletonText(title, "title", card.classList.contains("small"));
    setTimeout(() => {
      title.textContent = article.title || "Untitled Article";
      title.classList.remove("skeleton", "skeleton-title");
    }, 300);
  }

  if (meta) {
    showSkeletonText(meta, "meta", card.classList.contains("small"));
    setTimeout(() => {
      const readingTime = calculateReadingTime(article.content);
      meta.textContent = `${formatDate(article.date)} | ${
        article.category
      } | ${readingTime}`;
      meta.classList.remove("skeleton", "skeleton-meta");
    }, 500);
  }
}

function showSkeletonText(element, type, isSmall = false) {
  // Clear text content
  element.textContent = "";

  // Remove any existing skeleton
  element.classList.remove(
    "skeleton",
    "skeleton-title",
    "skeleton-meta",
    "small"
  );

  // Add skeleton classes
  element.classList.add("skeleton", `skeleton-${type}`);
  if (isSmall) {
    element.classList.add("small");
  }

  // Ensure skeleton is visible
  element.style.minHeight = type === "title" ? "1.2em" : "0.8em";
  element.style.display = "block";
}

function setupLazyLoading(card) {
  const img = card.querySelector(".article-image");
  const imageWrapper = card.querySelector(".article-image-wrapper");

  if (img && img.dataset.src && imageWrapper) {
    // Add synthwave loader to image wrapper instead of card
    card.classList.add("loading");
    const loaderDiv = document.createElement("div");
    loaderDiv.innerHTML = `
      <div class="pyramid-loader">
        <div class="pyramid-dot"></div>
        <div class="pyramid-line pyramid-line-1"></div>
        <div class="pyramid-line pyramid-line-2"></div>
        <div class="pyramid-line pyramid-line-3"></div>
        <div class="pyramid-line pyramid-line-4"></div>
      </div>
    `;
    imageWrapper.appendChild(loaderDiv); // Changed from card to imageWrapper

    // Load image
    const image = new Image();

    image.onload = () => {
      img.decoding = "async";
      img.src = img.dataset.src;
      card.classList.remove("loading");
      loaderDiv.remove();
    };

    image.onerror = () => {
      img.decoding = "async";
      img.src = "assets/images/fallback_image.png";
      card.classList.remove("loading");
      loaderDiv.remove();
    };

    image.src = img.dataset.src;
  }
}
