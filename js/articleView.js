// ============================================================================
// articleView.js - ARTICLE VIEW MANAGEMENT
// ============================================================================
// Version: 1.3 - FIXED active nav for ALL articles
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
  setActiveNav,
} from "./navigation.js";
import { xSvg, tiktokSvg, snapSvg, instagramSvg, youtubeSvg } from "./svg.js";

/**
 * Updates page title and meta description for SEO
 */
function updatePageMeta(article) {
  // Update page title
  document.title = `${article.title} | LevelUpOrDieTrying`;

  // Update or create meta description
  let metaDescription = document.querySelector('meta[name="description"]');
  if (!metaDescription) {
    metaDescription = document.createElement("meta");
    metaDescription.name = "description";
    document.head.appendChild(metaDescription);
  }

  // Use hook as description or fallback to truncated content
  const description =
    article.hook ||
    article.content?.replace(/<[^>]*>/g, "").substring(0, 155) + "..." ||
    "Read this article on LevelUpOrDieTrying";

  metaDescription.content = description;
}

// ============================================================================
// State Management
// ============================================================================
let randomArticleHistory = [];

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Formats a date string for reading page (always long format)
 * @param {string} dateStr - The date string to format
 * @returns {string} Formatted date with long month
 */
function formatDateReading(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// ============================================================================
// Article Display Functions
// ============================================================================

/**
 * Shows individual article in full view
 * @param {string} articleId - The ID of the article to display
 */
async function showArticleView(articleId) {
  const article = articlesData.find((a) => a.id === articleId);
  if (!article) {
    console.error(`Article not found: ${articleId}`);
    return;
  }

  const fromSearch = sessionStorage.getItem("fromSearch") === "true";
  const currentCategory = getCurrentCategory();

  const mainContentArea = document.getElementById("main-content-area");
  const categoryPageView = document.getElementById("category-page-view");
  const articleView = document.querySelector(".article-view");
  const searchResultsGrid = document.querySelector(".search-results-grid");

  if (!articleView) {
    console.error("Article view element not found");
    return;
  }

  // FIXED: ALWAYS show main content area
  if (categoryPageView && !categoryPageView.classList.contains("hidden")) {
    categoryPageView.classList.add("hidden");
    if (mainContentArea) mainContentArea.style.display = "";
  }

  if (mainContentArea) {
    const bentoGrid = mainContentArea.querySelector(".bento-grid");
    if (bentoGrid) bentoGrid.classList.add("hidden-element");
    if (searchResultsGrid) searchResultsGrid.style.display = "none";
  }

  articleView.classList.remove("hidden");
  populateArticleView(article, articleView);
  updatePageMeta(article);
  populateRandomArticles(articleId);

  if (window.applySavedFontSize) {
    window.applySavedFontSize();
  }

  const closeButton = articleView.querySelector(".close-article");
  if (closeButton) {
    closeButton.removeEventListener("click", closeArticleView);
    closeButton.addEventListener("click", closeArticleView);
  }

  window.scrollTo(0, 0);

  // FIXED: ALWAYS set nav active at END
  setActiveNav(currentCategory);
}
/**
 * Show article view in category page
 * @param {Object} article - The article object to display
 * @param {string} articleId - The ID of the article
 */
function showCategoryArticleView(article, articleId) {
  const categoryView = document.querySelector(".category-article-view");

  if (categoryView) {
    // Hide category page elements
    const heroGrid = document.querySelector(".category-hero-grid");
    const articlesList = document.querySelector(".category-articles-list");
    const loadMoreBtn = document.querySelector(".load-more-button");

    if (heroGrid) heroGrid.style.display = "none";
    if (articlesList) articlesList.style.display = "none";
    if (loadMoreBtn) loadMoreBtn.style.display = "none";

    // Show article view and populate content
    categoryView.classList.remove("hidden");
    populateArticleView(article, categoryView);
    populateRelatedCategoryArticles(categoryView, articleId);
    setupCategoryCloseButton();

    // Apply saved font size settings
    if (window.applySavedFontSize) {
      window.applySavedFontSize();
    }
  }
}

/**
 * Show article view in main page
 * @param {Object} article - The article object to display
 * @param {string} articleId - The ID of the article
 */
function showMainArticleView(article, articleId) {
  // Force main view state for random articles
  const categoryPageView = document.getElementById("category-page-view");
  if (categoryPageView) {
    categoryPageView.classList.add("hidden");
  }

  const mainContent = document.getElementById("main-content-area");
  if (mainContent) {
    mainContent.style.display = "";
  }

  // Get main page elements
  const bentoGrid = document.querySelector(".bento-grid");
  const articleView = document.querySelector(".article-view");
  const latestLabel = document.querySelector(".category-label.latest-label");

  if (!bentoGrid || !articleView) {
    console.error("Required elements not found");
    return;
  }

  // Hide bento grid and show article view
  bentoGrid.style.display = "none";
  articleView.classList.remove("hidden");

  // Hide latest label
  if (latestLabel) {
    latestLabel.classList.add("hidden-element");
  }

  // Populate article content
  populateArticleView(article, articleView);
  populateRandomArticles(articleId);
  setupCloseButton();

  // Apply saved font size settings
  if (window.applySavedFontSize) {
    window.applySavedFontSize();
  }
}

/**
 * Populates article view with content
 * @param {Object} article - The article object containing all article data
 * @param {HTMLElement} container - The container element to populate
 */
function populateArticleView(article, container) {
  const mainArticle = container.querySelector(".main-article");

  // Create article HTML structure with long date format for reading page
  mainArticle.innerHTML = `
   <article class="reading-layout">
     <header class="article-header">
       <span class="article-category">${
         article.category
           ? article.category.charAt(0).toUpperCase() +
             article.category.slice(1)
           : "Uncategorized"
       } | ${formatDateReading(article.date)} | ${calculateReadingTime(
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

  // Process inline images if available
  const articleBody = mainArticle.querySelector(".article-body");
  if (articleBody && article.inline_image) {
    const inlineImageHtml = `<img src="${article.inline_image}" alt="Inline image" class="inline-image" loading="lazy" />`;

    const paragraphs = articleBody.querySelectorAll("p");
    if (paragraphs.length > 2) {
      // Insert inline image in the middle of the article
      const middleIndex = Math.floor(paragraphs.length / 2);
      paragraphs[middleIndex - 1].insertAdjacentHTML(
        "afterend",
        inlineImageHtml
      );
    }
  }

  // Add social sharing icons
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

  // Create social media links
  socialLinks.forEach(({ social, href }) => {
    const link = document.createElement("a");
    link.href = href;
    link.className = "social-icon";
    link.setAttribute("data-social", social);
    socialSharing.appendChild(link);
  });

  // Apply social media icons
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

  // Populate article tags
  if (article.tags) {
    const tagsContainer = mainArticle.querySelector(".article-tags");
    populateArticleTags(tagsContainer, article.tags);
  }
}

/**
 * Creates fallback content for articles without body text
 * @param {Object} article - The article object
 * @returns {string} HTML string with fallback content
 */
function createFallbackContent(article) {
  return `
   <p>Published on ${formatDateReading(article.date)} in ${article.category}</p>
   <p>This is a featured article about ${article.title.toLowerCase()}. The full content would be displayed here in a real implementation.</p>
   <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.</p>
   <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
 `;
}

/**
 * Populates article tags with click functionality
 * @param {HTMLElement} tagsElement - The container element for tags
 * @param {Array} tags - Array of tag strings
 */
function populateArticleTags(tagsElement, tags) {
  tagsElement.innerHTML = "";

  // Check if we're on desktop
  const isDesktop = window.innerWidth >= 1200;

  if (isDesktop) {
    // Desktop: display tags in a single row
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
  } else {
    // Mobile: keep triangle pattern
    const sortedTags = [...tags].sort((a, b) => b.length - a.length);
    const rows = [
      { tags: sortedTags.slice(5, 6), className: "tag-row-top" },
      { tags: sortedTags.slice(3, 5), className: "tag-row-middle" },
      { tags: sortedTags.slice(0, 3), className: "tag-row-bottom" },
    ];

    rows.forEach(({ tags: rowTags, className }) => {
      if (rowTags.length > 0) {
        const rowContainer = document.createElement("div");
        rowContainer.className = `tag-row ${className}`;

        rowTags.forEach((tag) => {
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

          rowContainer.appendChild(tagElement);
        });

        tagsElement.appendChild(rowContainer);
      }
    });
  }
}
/**
 * Check if tag has results (excluding current article)
 * @param {string} tag - The tag to check for results
 * @returns {boolean} True if tag has other articles
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

/**
 * Shows no results message for tag search
 * @param {string} tag - The tag that has no results
 */
function showNoTagResultsMessage(tag) {
  // Hide article view first
  const articleView = document.querySelector(".article-view");
  if (articleView) {
    articleView.classList.add("hidden");
  }

  // Hide bento grid
  const bentoGrid = document.querySelector(".bento-grid");
  if (bentoGrid) {
    bentoGrid.style.display = "none";
  }

  // Create or get search container
  let searchContainer = document.querySelector(".search-results-grid");
  if (!searchContainer) {
    searchContainer = document.createElement("div");
    searchContainer.className = "category-grid search-results-grid";
    bentoGrid.parentNode.insertBefore(searchContainer, bentoGrid.nextSibling);
  }

  // Show no results message
  searchContainer.innerHTML = `<p class="no-results">No other articles found with the tag "${tag}".</p>`;
  searchContainer.style.display = "";

  // Update page title
  const categoryTitle = document.getElementById("category-title");
  if (categoryTitle) {
    categoryTitle.textContent = `TAG: ${tag.toUpperCase()}`;
  }

  // Set search flag and scroll to top
  sessionStorage.setItem("fromSearch", "true");
  window.scrollTo(0, 0);
}

/**
 * Searches articles by tag and displays results
 * @param {string} tag - The tag to search for
 */
async function searchArticlesByTag(tag) {
  // Get current article to exclude it from results
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

  // Hide article view
  const articleView = document.querySelector(".article-view");
  if (articleView) {
    articleView.classList.add("hidden");
  }

  // Hide bento grid and show search results
  const bentoGrid = document.querySelector(".bento-grid");
  if (bentoGrid) {
    bentoGrid.style.display = "none";
  }

  // Create or get search container
  let searchContainer = document.querySelector(".search-results-grid");
  if (!searchContainer) {
    searchContainer = document.createElement("div");
    searchContainer.className = "category-grid search-results-grid";
    bentoGrid.parentNode.insertBefore(searchContainer, bentoGrid.nextSibling);
  }

  // Clear previous results
  searchContainer.innerHTML = "";
  searchContainer.style.display = "";

  // Update page title
  const categoryTitle = document.getElementById("category-title");
  if (categoryTitle) {
    categoryTitle.textContent = `TAG: ${tag.toUpperCase()}`;
  }

  // Create article cards for tag results
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
 * @param {HTMLElement} container - The container element
 * @param {string} currentArticleId - The current article ID to exclude
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

  // Remove existing related articles
  const existingRelated = mainArticle.querySelector(".related-articles");
  if (existingRelated) {
    existingRelated.remove();
  }

  // Create related articles container
  const relatedContainer = document.createElement("div");
  relatedContainer.className = "related-articles";
  relatedContainer.innerHTML = `
   <h3 style="color: var(--text-primary); margin: 2rem 0 1rem 0; text-align: center;">More ${currentCategory} articles:</h3>
   <div class="related-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; margin-top: 1rem;"></div>
 `;

  mainArticle.appendChild(relatedContainer);

  // Populate related articles grid
  const relatedGrid = relatedContainer.querySelector(".related-grid");
  otherCategoryArticles.forEach(async (article) => {
    const card = await createArticleCard(article, "small");
    relatedGrid.appendChild(card);
  });
}

/**
 * Populates random articles in sidebar
 * @param {string} currentArticleId - The current article ID to exclude
 */
function populateRandomArticles(currentArticleId) {
  // Filter out current article
  const otherArticles = articlesData.filter(
    (article) => article.id !== currentArticleId
  );

  // Get 2 random articles
  const randomArticles = otherArticles
    .sort(() => Math.random() - 0.5)
    .slice(0, 2);

  // Populate random article cards
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
 * @returns {Object} Random article object
 */
function getRandomArticle() {
  // Filter out recently shown articles
  let availableArticles = articlesData.filter(
    (article) => !randomArticleHistory.includes(article.id)
  );

  // Reset history if all articles have been shown
  if (availableArticles.length === 0) {
    randomArticleHistory = [];
    availableArticles = [...articlesData];
  }

  // Select random article
  const randomIndex = Math.floor(Math.random() * availableArticles.length);
  const randomArticle = availableArticles[randomIndex];

  // Add to history
  randomArticleHistory.push(randomArticle.id);
  return randomArticle;
}

// ============================================================================
// Close Article Functions
// ============================================================================

/**
 * Closes article view and returns to previous context
 */
function closeArticleView() {
  // Check if we came from search
  const fromSearch = sessionStorage.getItem("fromSearch") === "true";

  // Get main page elements
  const bentoGrid = document.querySelector(".bento-grid");
  const articleView = document.querySelector(".article-view");
  const searchResultsGrid = document.querySelector(".search-results-grid");
  const categoryPageView = document.getElementById("category-page-view");

  // Hide article view
  if (articleView) {
    articleView.classList.add("hidden");
  }

  // Return to appropriate view based on context
  if (fromSearch && searchResultsGrid) {
    // Return to search results
    searchResultsGrid.style.display = "grid";
    if (bentoGrid) bentoGrid.style.display = "none";
    if (categoryPageView) categoryPageView.classList.add("hidden");
    // Keep the fromSearch flag to maintain context
  } else {
    // Check if we should return to category page or main view
    const isInCategory = getIsInCategoryPage();

    if (
      isInCategory &&
      categoryPageView &&
      !categoryPageView.classList.contains("hidden")
    ) {
      // Return to category page view
      const heroGrid = document.querySelector(".category-hero-grid");
      const articlesList = document.querySelector(".category-articles-list");
      const loadMoreBtn = document.querySelector(".load-more-button");

      if (heroGrid) heroGrid.style.display = "";
      if (articlesList) articlesList.style.display = "";
      if (loadMoreBtn) loadMoreBtn.style.display = "";
      if (bentoGrid) bentoGrid.style.display = "none";
    } else {
      // Return to latest/main view
      if (bentoGrid) bentoGrid.style.display = "";
      if (categoryPageView) categoryPageView.classList.add("hidden");
    }

    // Clear search context only if not from search
    sessionStorage.removeItem("fromSearch");
  }

  // Scroll to top
  window.scrollTo(0, 0);
  history.back(); // FIXED: Back button works
}

/**
 * Closes category article view
 * @param {Object} lastSearch - The last search context
 */
function closeCategoryArticleView(lastSearch) {
  const categoryView = document.querySelector(".category-article-view");
  const categorySearchResults = document.querySelector(
    ".category-search-results"
  );

  if (categoryView) {
    categoryView.classList.add("hidden");

    // Return to appropriate category context
    if (lastSearch && lastSearch.inCategory) {
      // Return to category search results
      const heroGrid = document.querySelector(".category-hero-grid");
      const articlesList = document.querySelector(".category-articles-list");
      const loadMoreBtn = document.querySelector(".load-more-button");

      if (categorySearchResults) categorySearchResults.style.display = "";
      if (heroGrid) heroGrid.style.display = "none";
      if (articlesList) articlesList.style.display = "none";
      if (loadMoreBtn) loadMoreBtn.style.display = "none";
    } else {
      // Return to normal category view
      const heroGrid = document.querySelector(".category-hero-grid");
      const articlesList = document.querySelector(".category-articles-list");
      const loadMoreBtn = document.querySelector(".load-more-button");

      if (heroGrid) heroGrid.style.display = "";
      if (articlesList) articlesList.style.display = "";
      if (loadMoreBtn) loadMoreBtn.style.display = "";
    }
  }
}

/**
 * Closes main article view
 * @param {Object} lastSearch - The last search context
 */
function closeMainArticleView(lastSearch) {
  const bentoGrid = document.querySelector(".bento-grid");
  const articleView = document.querySelector(".article-view");
  const searchResultsGrid = document.querySelector(".search-results-grid");
  const latestLabel = document.querySelector(".category-label.latest-label");

  // Return to appropriate main context
  if (searchResultsGrid && lastSearch && !lastSearch.inCategory) {
    // Return to search results
    bentoGrid.style.display = "none";
    searchResultsGrid.style.display = "";
    if (latestLabel) latestLabel.style.display = "none";
  } else {
    // Return to normal main view
    bentoGrid.style.display = "";
    if (latestLabel) latestLabel.style.display = "block";
  }

  // Hide article view
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
    // Remove existing event listeners by cloning the button
    closeButton.replaceWith(closeButton.cloneNode(true));

    // Add new event listener
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
    // Remove existing event listeners by cloning the button
    closeButton.replaceWith(closeButton.cloneNode(true));

    // Add new event listener
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
