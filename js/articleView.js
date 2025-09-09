// ============================================================================
// articleView.js - ARTICLE VIEW MANAGEMENT
// ============================================================================
// Description: Handles full article display, close/open logic, and related articles
// Version: 1.0 - Split from data.js for better organization
// ============================================================================

import {
  formatDate,
  calculateReadingTime,
  extractAltFromFilename,
} from "./utils.js";
import { createArticleCard, populateArticleCard } from "./articleCards.js";
import { articlesData } from "./articleLoader.js";
import {
  getCurrentCategory,
  getIsInCategoryPage,
  setIsInCategoryPage,
} from "./navigation.js";
import { xSvg, tiktokSvg, snapSvg, instagramSvg, youtubeSvg } from "./svg.js";

// ============================================================================
// State Management
// ============================================================================
let randomArticleHistory = [];

// ============================================================================
// Article Display Functions
// ============================================================================

/**
 * Shows individual article in full view
 */
// In the showArticleView function in articleView.js
async function showArticleView(articleId) {
  console.log(`[DEBUG] Entering showArticleView with articleId: ${articleId}`);

  // Get the article data
  const article = articlesData.find((a) => a.id === articleId);
  if (!article) {
    console.error(`[DEBUG] Article not found: ${articleId}`);
    return;
  }

  // Check if we're coming from search results
  const fromSearch = sessionStorage.getItem("fromSearch") === "true";
  console.log("[DEBUG] fromSearch flag:", fromSearch);

  // Keep track of current category
  const currentCategory = getCurrentCategory();
  console.log("[DEBUG] Current category:", currentCategory);

  // Simplified view switching - hide everything first
  const mainContentArea = document.getElementById("main-content-area");
  const categoryPageView = document.getElementById("category-page-view");
  const articleView = document.querySelector(".article-view");
  const searchResultsGrid = document.querySelector(".search-results-grid");

  // Make sure article view exists
  if (!articleView) {
    console.error("[DEBUG] Article view element not found");
    return;
  }

  console.log("[DEBUG] Hiding other views");
  // Show main content area if we're in a category
  if (categoryPageView && !categoryPageView.classList.contains("hidden")) {
    categoryPageView.classList.add("hidden");
    console.log("[DEBUG] Hid category page view");
    if (mainContentArea) {
      mainContentArea.style.display = "";
      console.log("[DEBUG] Showed main content area");

      // Update category title if we're in a category context
      const currentCategory = getCurrentCategory();
      if (currentCategory !== "latest") {
        const categoryTitle = document.getElementById("category-title");
        if (categoryTitle) {
          const displayCategory =
            currentCategory.charAt(0).toUpperCase() + currentCategory.slice(1);
          categoryTitle.textContent = displayCategory;
        }
      }
    }
  }

  // Inside main content, hide bento grid but show article view
  if (mainContentArea) {
    const bentoGrid = mainContentArea.querySelector(".bento-grid");

    if (bentoGrid) {
      bentoGrid.classList.add("hidden-element");
      console.log("[DEBUG] Hid bento grid");
    }

    // Hide search results only if explicitly told to (but remember we're from search)
    if (searchResultsGrid) {
      searchResultsGrid.style.display = "none";
      console.log("[DEBUG] Hid search results grid");
    }
  }

  // Show and populate article view
  console.log("[DEBUG] Showing article view");
  articleView.classList.remove("hidden");
  populateArticleView(article, articleView);
  console.log("[DEBUG] Populated article view");
  populateRandomArticles(articleId);
  console.log("[DEBUG] Populated random articles");

  // Make sure close button works
  const closeButton = articleView.querySelector(".close-article");
  if (closeButton) {
    closeButton.removeEventListener("click", closeArticleView);
    closeButton.addEventListener("click", closeArticleView);
    console.log("[DEBUG] Set up close button");
  }

  window.scrollTo(0, 0);
  console.log("[DEBUG] Scrolled to top");
}
/**
 * Show article view in category page
 */
function showCategoryArticleView(article, articleId) {
  const categoryView = document.querySelector(".category-article-view");

  if (categoryView) {
    const heroGrid = document.querySelector(".category-hero-grid");
    const articlesList = document.querySelector(".category-articles-list");
    const loadMoreBtn = document.querySelector(".load-more-button");

    if (heroGrid) heroGrid.style.display = "none";
    if (articlesList) articlesList.style.display = "none";
    if (loadMoreBtn) loadMoreBtn.style.display = "none";

    categoryView.classList.remove("hidden");
    populateArticleView(article, categoryView);
    populateRelatedCategoryArticles(categoryView, articleId);
    setupCategoryCloseButton();
  }
}

/**
 * Show article view in main page
 */
function showMainArticleView(article, articleId) {
  // Force main view state for random articles
  const categoryPageView = document.getElementById("category-page-view");
  if (categoryPageView) {
    categoryPageView.classList.add("hidden");
    console.log("Hidden category page view");
  }

  const mainContent = document.getElementById("main-content-area");
  if (mainContent) {
    mainContent.style.display = "";
    console.log("Showed main content area");
  }

  const bentoGrid = document.querySelector(".bento-grid");
  const articleView = document.querySelector(".article-view");
  const latestLabel = document.querySelector(".category-label.latest-label");

  if (!bentoGrid || !articleView) {
    console.error("Required elements not found");
    return;
  }

  bentoGrid.style.display = "none";
  articleView.classList.remove("hidden");

  if (latestLabel) {
    latestLabel.classList.add("hidden-element");
  }

  populateArticleView(article, articleView);
  populateRandomArticles(articleId);
  setupCloseButton();
}

/**
 * Populates article view with content
 */
function populateArticleView(article, container) {
  const mainArticle = container.querySelector(".main-article");

  mainArticle.innerHTML = `
   <article class="reading-layout">
     <header class="article-header">
       <span class="article-category">${
         article.category?.charAt(0).toUpperCase() +
           article.category?.slice(1) || "Uncategorized"
       } | ${formatDate(article.date)} | ${calculateReadingTime(
    article.content
  )}</span>
       <h1 class="article-main-title">${
         article.title || "Untitled Article"
       }</h1>
       <p class="article-hook">${article.hook || "Here comes the hook"}</p>
       
       <div class="social-sharing"></div>
     </header>

    <img 
  src="${article.image || "assets/images/fallback_image.png"}" 
  alt="${
    extractAltFromFilename(article.image) || article.title || "Article image"
  }"
  class="main-article-image"
/>
     
     <div class="article-body">
       ${article.content || createFallbackContent(article)}
     </div>
     
     <footer class="article-footer">
       <div class="article-tags"></div>
     </footer>
   </article>
 `;

  // Process inline images
  const articleBody = mainArticle.querySelector(".article-body");
  if (articleBody && article.inline_image) {
    const inlineImageHtml = `<img src="${article.inline_image}" alt="Inline image" class="inline-image" loading="lazy" />`;

    const paragraphs = articleBody.querySelectorAll("p");
    if (paragraphs.length > 2) {
      const middleIndex = Math.floor(paragraphs.length / 2);
      paragraphs[middleIndex - 1].insertAdjacentHTML(
        "afterend",
        inlineImageHtml
      );
    }
  }

  // Add social icons
  const socialSharing = mainArticle.querySelector(".social-sharing");
  const socialLinks = [
    {
      social: "x",
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        article.title
      )}&url=${encodeURIComponent(window.location.href)}`,
    },
    {
      social: "tiktok",
      href: `https://www.tiktok.com/`,
    },
    {
      social: "snap",
      href: `https://www.snapchat.com/`,
    },
    {
      social: "instagram",
      href: `https://www.instagram.com/`,
    },
    {
      social: "youtube",
      href: `https://www.youtube.com/`,
    },
  ];

  socialLinks.forEach(({ social, href }) => {
    const link = document.createElement("a");
    link.href = href;
    link.className = "social-icon";
    link.setAttribute("data-social", social);
    socialSharing.appendChild(link);
  });

  // Apply icons after adding links
  const socialIcons = socialSharing.querySelectorAll(".social-icon");
  const socialSvgs = {
    x: xSvg,
    tiktok: tiktokSvg,
    snap: snapSvg,
    instagram: instagramSvg,
    youtube: youtubeSvg,
  };

  socialIcons.forEach((icon) => {
    const social = icon.getAttribute("data-social");
    if (socialSvgs[social]) {
      icon.innerHTML = socialSvgs[social];
    }
  });

  // Populate tags separately
  if (article.tags) {
    const tagsContainer = mainArticle.querySelector(".article-tags");
    populateArticleTags(tagsContainer, article.tags);
  }
}

/**
 * Creates fallback content for articles without body text
 */
function createFallbackContent(article) {
  return `
   <p>Published on ${formatDate(article.date)} in ${article.category}</p>
   <p>This is a featured article about ${article.title.toLowerCase()}. The full content would be displayed here in a real implementation.</p>
   <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.</p>
   <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
 `;
}

/**
 * Populates article tags with click functionality
 */
function populateArticleTags(tagsElement, tags) {
  tagsElement.innerHTML = "";

  tags.forEach((tag) => {
    const tagElement = document.createElement("span");
    tagElement.className = "tag";
    tagElement.textContent = tag;

    tagElement.addEventListener("click", () => {
      const hasResults = checkTagHasResults(tag);
      if (hasResults) {
        tagElement.classList.add("clicked");
        setTimeout(() => {
          searchArticlesByTag(tag);
        }, 250);
      } else {
        showNoTagResultsMessage(tag);
      }
    });

    tagsElement.appendChild(tagElement);
  });
}

/**
 * Check if tag has results
 */
function checkTagHasResults(tag) {
  const currentArticleTitle = document.querySelector(
    ".main-article .article-main-title"
  );
  const currentArticle = currentArticleTitle
    ? articlesData.find((a) => a.title === currentArticleTitle.textContent)
    : null;

  const tagArticles = articlesData.filter(
    (article) =>
      article.tags &&
      article.tags.includes(tag) &&
      article.id !== (currentArticle ? currentArticle.id : null)
  );

  return tagArticles.length > 0;
}

function showNoTagResultsMessage(tag) {
  // Hide article view first
  const articleView = document.querySelector(".article-view");
  if (articleView) {
    articleView.classList.add("hidden");
  }

  // Create a proper no-results display
  const bentoGrid = document.querySelector(".bento-grid");
  if (bentoGrid) {
    bentoGrid.style.display = "none";
  }

  let searchContainer = document.querySelector(".search-results-grid");
  if (!searchContainer) {
    searchContainer = document.createElement("div");
    searchContainer.className = "category-grid search-results-grid";
    bentoGrid.parentNode.insertBefore(searchContainer, bentoGrid.nextSibling);
  }

  searchContainer.innerHTML = `<p class="no-results">No other articles found with the tag "${tag}".</p>`;
  searchContainer.style.display = "";

  // Update title
  const categoryTitle = document.getElementById("category-title");
  if (categoryTitle) {
    categoryTitle.textContent = `TAG: ${tag.toUpperCase()}`;
  }

  // Set search flag and scroll to top
  sessionStorage.setItem("fromSearch", "true");
  window.scrollTo(0, 0);
}
async function searchArticlesByTag(tag) {
  // Get current article to exclude it
  const currentArticleTitle = document.querySelector(
    ".main-article .article-main-title"
  );
  const currentArticle = currentArticleTitle
    ? articlesData.find((a) => a.title === currentArticleTitle.textContent)
    : null;

  // Filter articles with the tag, excluding current article
  const tagArticles = articlesData.filter(
    (article) =>
      article.tags &&
      article.tags.includes(tag) &&
      article.id !== (currentArticle ? currentArticle.id : null)
  );

  // Hide article view first
  const articleView = document.querySelector(".article-view");
  if (articleView) {
    articleView.classList.add("hidden");
  }

  // Hide bento grid and show search results
  const bentoGrid = document.querySelector(".bento-grid");
  if (bentoGrid) {
    bentoGrid.style.display = "none";
  }

  let searchContainer = document.querySelector(".search-results-grid");
  if (!searchContainer) {
    searchContainer = document.createElement("div");
    searchContainer.className = "category-grid search-results-grid";
    bentoGrid.parentNode.insertBefore(searchContainer, bentoGrid.nextSibling);
  }

  searchContainer.innerHTML = "";
  searchContainer.style.display = "";

  // Update title
  const categoryTitle = document.getElementById("category-title");
  if (categoryTitle) {
    categoryTitle.textContent = `TAG: ${tag.toUpperCase()}`;
  }

  // Create cards for tag results
  for (const article of tagArticles) {
    const card = await createArticleCard(article, "small");
    card.setAttribute("data-from-search", "true");
    searchContainer.appendChild(card);
  }

  // Set search flag and scroll to top
  sessionStorage.setItem("fromSearch", "true");
  window.scrollTo(0, 0);
}

/**
 * Populates related category articles
 */
function populateRelatedCategoryArticles(container, currentArticleId) {
  const currentCategory = getCurrentCategory();
  const otherCategoryArticles = articlesData
    .filter(
      (article) =>
        article.category?.toLowerCase() === currentCategory &&
        article.id !== currentArticleId
    )
    .slice(0, 6);

  const mainArticle = container.querySelector(".main-article");
  if (!mainArticle) return;

  const existingRelated = mainArticle.querySelector(".related-articles");
  if (existingRelated) {
    existingRelated.remove();
  }

  const relatedContainer = document.createElement("div");
  relatedContainer.className = "related-articles";
  relatedContainer.innerHTML = `
   <h3 style="color: var(--text-primary); margin: 2rem 0 1rem 0; text-align: center;">More ${currentCategory} articles:</h3>
   <div class="related-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; margin-top: 1rem;"></div>
 `;

  mainArticle.appendChild(relatedContainer);

  const relatedGrid = relatedContainer.querySelector(".related-grid");

  otherCategoryArticles.forEach(async (article) => {
    const card = await createArticleCard(article, "small");
    relatedGrid.appendChild(card);
  });
}

/**
 * Populates random articles in sidebar
 */
function populateRandomArticles(currentArticleId) {
  const otherArticles = articlesData.filter(
    (article) => article.id !== currentArticleId
  );

  const randomArticles = otherArticles
    .sort(() => Math.random() - 0.5)
    .slice(0, 2);

  const randomCards = document.querySelectorAll(
    ".random-articles .article-card"
  );

  randomArticles.forEach((article, index) => {
    if (randomCards[index]) {
      populateArticleCard(randomCards[index], article);
    }
  });
}

/**
 * Gets a random article that hasn't been shown recently
 */
function getRandomArticle() {
  let availableArticles = articlesData.filter(
    (article) => !randomArticleHistory.includes(article.id)
  );

  if (availableArticles.length === 0) {
    randomArticleHistory = [];
    availableArticles = [...articlesData];
  }

  const randomIndex = Math.floor(Math.random() * availableArticles.length);
  const randomArticle = availableArticles[randomIndex];

  randomArticleHistory.push(randomArticle.id);
  return randomArticle;
}

// ============================================================================
// Close Article Functions
// ============================================================================

/**
 * Closes article view and returns to previous context
 */
// In the closeArticleView function in articleView.js
function closeArticleView() {
  // Check if we came from search
  const fromSearch = sessionStorage.getItem("fromSearch") === "true";
  console.log("Closing article - fromSearch:", fromSearch);

  const bentoGrid = document.querySelector(".bento-grid");
  const articleView = document.querySelector(".article-view");
  const searchResultsGrid = document.querySelector(".search-results-grid");
  const categoryPageView = document.getElementById("category-page-view");

  // Hide article view
  if (articleView) {
    articleView.classList.add("hidden");
  }

  // Return to appropriate view
  if (fromSearch && searchResultsGrid) {
    // Return to search results
    searchResultsGrid.style.display = "grid"; // Explicitly set to grid to match search results layout
    if (bentoGrid) bentoGrid.style.display = "none";
    if (categoryPageView) categoryPageView.classList.add("hidden");
    // Keep the fromSearch flag to maintain context
  } else {
    // Return to latest view
    if (bentoGrid) bentoGrid.style.display = "";
    if (categoryPageView) categoryPageView.classList.add("hidden");
    // Clear search context only if not from search
    sessionStorage.removeItem("fromSearch");
  }

  window.scrollTo(0, 0);
}
function closeCategoryArticleView(lastSearch) {
  const categoryView = document.querySelector(".category-article-view");
  const categorySearchResults = document.querySelector(
    ".category-search-results"
  );

  if (categoryView) {
    categoryView.classList.add("hidden");

    // If we were in a category search, show those results again
    if (lastSearch && lastSearch.inCategory) {
      const heroGrid = document.querySelector(".category-hero-grid");
      const articlesList = document.querySelector(".category-articles-list");
      const loadMoreBtn = document.querySelector(".load-more-button");

      if (categorySearchResults) categorySearchResults.style.display = "";

      if (heroGrid) heroGrid.style.display = "none";
      if (articlesList) articlesList.style.display = "none";
      if (loadMoreBtn) loadMoreBtn.style.display = "none";
    } else {
      // Normal category view
      const heroGrid = document.querySelector(".category-hero-grid");
      const articlesList = document.querySelector(".category-articles-list");
      const loadMoreBtn = document.querySelector(".load-more-button");

      if (heroGrid) heroGrid.style.display = "";
      if (articlesList) articlesList.style.display = "";
      if (loadMoreBtn) loadMoreBtn.style.display = "";
    }
  }
}

function closeMainArticleView(lastSearch) {
  const bentoGrid = document.querySelector(".bento-grid");
  const articleView = document.querySelector(".article-view");
  const searchResultsGrid = document.querySelector(".search-results-grid");
  const latestLabel = document.querySelector(".category-label.latest-label");

  // If we have search results and were in a search before
  if (searchResultsGrid && lastSearch && !lastSearch.inCategory) {
    bentoGrid.style.display = "none";
    searchResultsGrid.style.display = "";
    if (latestLabel) latestLabel.style.display = "none";
  } else {
    // Normal main view
    bentoGrid.style.display = "";
    if (latestLabel) latestLabel.style.display = "block";
  }

  if (articleView) {
    articleView.classList.add("hidden");
  }
}

// ============================================================================
// Event Setup Functions
// ============================================================================

/**
 * Sets up close button for main article view
 */
function setupCloseButton() {
  const closeButton = document.querySelector(".article-view .close-article");
  if (closeButton) {
    closeButton.replaceWith(closeButton.cloneNode(true));

    const newCloseButton = document.querySelector(
      ".article-view .close-article"
    );
    newCloseButton.addEventListener("click", closeArticleView);
  }
}

/**
 * Sets up close button for category article view
 */
function setupCategoryCloseButton() {
  const closeButton = document.querySelector(
    ".category-article-view .close-article"
  );
  if (closeButton) {
    closeButton.replaceWith(closeButton.cloneNode(true));

    const newCloseButton = document.querySelector(
      ".category-article-view .close-article"
    );
    newCloseButton.addEventListener("click", closeArticleView);
  }
}

// ============================================================================
// Export Functions
// ============================================================================
export { showArticleView, closeArticleView, getRandomArticle };
