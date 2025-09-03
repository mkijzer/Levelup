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
async function showArticleView(articleId) {
  console.log(`Showing article: ${articleId}`);

  const article = articlesData.find((a) => a.id === articleId);
  if (!article) {
    console.error(`Article not found: ${articleId}`);
    return;
  }

  // Hide ALL article cards with this ID
  const allCards = document.querySelectorAll(
    `[data-article-id="${articleId}"]`
  );
  console.log("Found cards to hide:", allCards.length);
  allCards.forEach((card) => {
    card.style.display = "none";
    card.setAttribute("data-hidden-for-view", "true");
  });

  if (getIsInCategoryPage()) {
    showCategoryArticleView(article, articleId);
  } else {
    showMainArticleView(article, articleId);
  }

  window.scrollTo(0, 0);
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
    latestLabel.style.display = "none";
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

/**
 * Search articles by tag
 */
function searchArticlesByTag(tag) {
  // This will be handled by the main data.js coordinator
  // For now, just log the action
  console.log(`Searching for tag: ${tag}`);
}

/**
 * Show no tag results message
 */
function showNoTagResultsMessage(tag) {
  // This will be handled by the main data.js coordinator
  // For now, just log the action
  console.log(`No results found for tag: ${tag}`);
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
function closeArticleView() {
  if (getIsInCategoryPage()) {
    closeCategoryArticleView();
  } else {
    closeMainArticleView();
  }

  // Show the hidden article card
  const hiddenCard = document.querySelector('[data-hidden-for-view="true"]');
  if (hiddenCard) {
    console.log("Found hidden card to show:", hiddenCard);
    hiddenCard.style.display = "";
    hiddenCard.removeAttribute("data-hidden-for-view");
  } else {
    console.log("No hidden card found");
  }

  window.scrollTo(0, 0);
}

/**
 * Close category article view
 */
function closeCategoryArticleView() {
  const categoryView = document.querySelector(".category-article-view");

  if (categoryView) {
    categoryView.classList.add("hidden");

    const heroGrid = document.querySelector(".category-hero-grid");
    const articlesList = document.querySelector(".category-articles-list");
    const loadMoreBtn = document.querySelector(".load-more-button");

    if (heroGrid) heroGrid.style.display = "";
    if (articlesList) articlesList.style.display = "";
    if (loadMoreBtn) loadMoreBtn.style.display = "";
  }
}

/**
 * Close main article view
 */
function closeMainArticleView() {
  const bentoGrid = document.querySelector(".bento-grid");
  const articleView = document.querySelector(".article-view");
  const latestLabel = document.querySelector(".category-label.latest-label");

  if (bentoGrid) {
    bentoGrid.style.display = "";
  }

  if (articleView) {
    articleView.classList.add("hidden");
  }

  if (latestLabel) {
    latestLabel.style.display = "block";
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
