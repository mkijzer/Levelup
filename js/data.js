// ============================================================================
// data.js
// ============================================================================
// Description: Core logic for the SPA, handling data fetching, article card
//              creation, and user interactions like navigation and search.
// Version: 1.0
// Author: [Mike]
// ============================================================================

// ============================================================================
// Global Variables and Constants
// ============================================================================

/**
 * Mobile menu element for toggling visibility.
 * @type {HTMLElement|null}
 */
const mobileMenu = document.querySelector(".mobile-menu");

/**
 * Flag to prevent multiple simultaneous menu transitions.
 * @type {boolean}
 */
let menuTransitioning = false;

/**
 * Array to store fetched article data from articles.json.
 * @type {Array}
 */
let articlesData = [];

/**
 * Array to track viewed random article IDs to avoid repetition.
 * @type {Array}
 */
let randomArticleHistory = [];

/**
 * Stores scroll position for the 'latest' view to restore on navigation.
 * @type {number}
 */
let lastLatestScrollY = 0;

// ============================================================================
// Initialization and Event Listeners
// ============================================================================

/**
 * Initializes the application on DOM content load.
 * Fetches articles and quotes, sets up navigation and interaction listeners.
 */
document.addEventListener("DOMContentLoaded", () => {
  // Fetch articles from articles.json
  fetch("data/articles.json")
    .then((response) => {
      if (!response.ok) throw new Error("Network response was not ok");
      return response.json();
    })
    .then((data) => {
      if (data.length === 0) {
        console.warn("Cool articles coming soon!");
        return;
      }
      articlesData = data;

      // Populate category grids with articles
      const articlesContainer = document.querySelector(".container");
      const categoryGrids =
        articlesContainer.querySelectorAll(".category-grid");
      const usedArticleIds = new Set();

      (async () => {
        // Populate each category grid with up to 3 unique articles
        for (const grid of categoryGrids) {
          const category = normalizeCategory(
            grid.getAttribute("data-category") || ""
          );
          const categoryArticles = articlesData
            .filter(
              (article) =>
                normalizeCategory(article.category || "") === category &&
                !usedArticleIds.has(article.id)
            )
            .slice(0, 3);
          for (const article of categoryArticles) {
            const card = await createArticleCard(article, "small");
            grid.appendChild(card);
            usedArticleIds.add(article.id);
          }
        }

        // Handle content loading based on URL hash
        const loadContent = () => {
          let category = window.location.hash.slice(1) || "latest";
          document.querySelectorAll(".categories a").forEach((link) => {
            link.classList.remove("active");
            if (link.getAttribute("href") === `#${category}`) {
              link.classList.add("active");
            }
          });
          if (category === "random") {
            loadRandomArticle();
          } else if (category !== "more") {
            loadCategory(category);
          }
        };

        // Initial content load
        loadContent();

        // Update content on hash change
        window.addEventListener("hashchange", loadContent);

        // Add click listeners to nav items including icons
        document.querySelectorAll(".nav-item").forEach((item) => {
          item.addEventListener("click", (e) => {
            e.preventDefault();
            const link = item.querySelector("a");
            if (link) window.location.hash = link.getAttribute("href");
          });
        });

        // Add click effect to nav icons
        document.querySelectorAll(".nav-item a").forEach((link) => {
          link.addEventListener("mousedown", () => {
            const icon = link.querySelector(".nav-icon");
            if (icon) icon.classList.add("active-icon");
          });
          link.addEventListener("mouseup", () => {
            const icon = link.querySelector(".nav-icon");
            if (icon) icon.classList.remove("active-icon");
          });
        });

        // Add this after your existing nav click handlers
        document.querySelectorAll(".nav-item").forEach((item) => {
          item.addEventListener("click", () => {
            // Remove active class from all nav items
            document
              .querySelectorAll(".nav-item")
              .forEach((nav) => nav.classList.remove("active"));

            // Add active class to clicked item
            item.classList.add("active");
          });
        });

        // Random article link in mobile menu
        const mobileRandomLink = document.getElementById("mobile-random-link");
        if (mobileRandomLink) {
          mobileRandomLink.addEventListener("click", (e) => {
            e.preventDefault();
            loadRandomArticle();
          });
        }

        // Search functionality for desktop and mobile
        const searchBar = document.getElementById("search-bar");
        const mobileSearchBar = document.getElementById("mobile-search-bar");
        const handleSearch = (e) => {
          const query = e.target.value;
          if (query.length > 0) {
            loadSearchResults(query);
          } else {
            loadCategory("latest");
          }
        };

        if (searchBar) {
          searchBar.addEventListener("input", handleSearch);
        }
        if (mobileSearchBar) {
          mobileSearchBar.addEventListener("input", handleSearch);
        }
      })();
    })
    .catch((error) => console.error("Error loading articles:", error));

  // Fetch quotes from quotes.json
  fetch("data/quotes.json")
    .then((response) => {
      if (!response.ok) throw new Error("Network response was not ok");
      return response.json();
    })
    .then((data) => {
      if (data.length === 0) {
        console.warn("No quotes available!");
        return;
      }
      // Populate separator quote
      const separatorQuote = document.querySelector(".separator-quote");
      const quoteText = separatorQuote.querySelector(".quote-text");
      const quoteAuthor = separatorQuote.querySelector(".quote-author");
      const randomIndex1 = Math.floor(Math.random() * data.length);
      quoteText.textContent = `"${data[randomIndex1].text}"`;
      quoteAuthor.textContent = `- ${data[randomIndex1].author}`;

      // Populate bottom quote
      const bottomQuoteText = document.querySelector("#quote-text");
      const bottomQuoteAuthor = document.querySelector("#quote-author");
      let randomIndex2 = Math.floor(Math.random() * data.length);
      while (randomIndex2 === randomIndex1) {
        randomIndex2 = Math.floor(Math.random() * data.length);
      }
      bottomQuoteText.textContent = `"${data[randomIndex2].text}"`;
      bottomQuoteAuthor.textContent = `- ${data[randomIndex2].author}`;
    })
    .catch((error) => {
      console.error("Error loading quotes:", error);
      document.querySelector(".separator-quote .quote-text").textContent =
        "Failed to load quote.";
      document.querySelector("#quote-text").textContent =
        "Failed to load quote.";
    });

  // Category modal toggle on click or hover
  const categoryItem = document.querySelector(
    '.nav-item a[href="#category"]'
  ).parentElement;
  const categoryModal = document.getElementById("category-modal");

  if (categoryItem) {
    // Toggle modal on click
    categoryItem.addEventListener("click", (e) => {
      e.preventDefault();
      categoryModal.style.display =
        categoryModal.style.display === "block" ? "none" : "block";
    });

    // Show modal on mouse enter
    categoryItem.addEventListener("mouseenter", () => {
      categoryModal.style.display = "block";
    });

    categoryModal.addEventListener("mouseenter", () => {
      categoryModal.style.display = "block";
    });

    // Hide modal on mouse leave with a short delay to prevent flicker
    function hideModalIfNotHovered() {
      setTimeout(() => {
        if (
          !categoryItem.matches(":hover") &&
          !categoryModal.matches(":hover")
        ) {
          categoryModal.style.display = "none";
        }
      }, 150);
    }

    categoryItem.addEventListener("mouseleave", hideModalIfNotHovered);
    categoryModal.addEventListener("mouseleave", hideModalIfNotHovered);
  }

  // Close modal when clicking outside
  if (categoryModal) {
    categoryModal.addEventListener("click", (e) => {
      if (e.target === categoryModal) {
        categoryModal.classList.add("hidden");
      }
    });
  }

  // Mobile menu toggle on "more" link click
  const moreLink = document.getElementById("more-link");
  if (moreLink) {
    moreLink.addEventListener("click", () => {
      if (menuTransitioning) return;
      if (!mobileMenu.classList.contains("open")) {
        mobileMenu.style.display = "flex";
        requestAnimationFrame(() => {
          mobileMenu.classList.add("open");
        });
      } else {
        menuTransitioning = true;
        mobileMenu.classList.remove("open");
        setTimeout(() => {
          mobileMenu.style.display = "none";
          menuTransitioning = false;
        }, 900);
      }
    });
  }

  // Ensure mobile menu is hidden by default
  if (!mobileMenu.classList.contains("open")) {
    mobileMenu.style.display = "none";
  }
});

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Normalizes a category string to lowercase and trimmed format.
 * @param {string} category - The category to normalize
 * @returns {string} Normalized category
 */
function normalizeCategory(category) {
  return category.toLowerCase().trim();
}

/**
 * Formats a date string into a readable format (e.g., "Jan 1, 2023").
 * @param {string} dateStr - The date string to format
 * @returns {string} Formatted date
 */
function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Preloads an image and provides a fallback on error.
 * @param {string} url - The image URL to preload
 * @returns {Promise<string>} Resolved URL or fallback image path
 */
function preloadImage(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = url;
    img.onload = () => resolve(url);
    img.onerror = () => resolve("assets/images/fallback_image.png");
  });
}

// ============================================================================
// Article Card Management
// ============================================================================

/**
 * Creates an article card element with a loading state.
 * @param {Object} article - Article data object
 * @param {string} type - Card type ("small" or "huge")
 * @param {boolean} isSideBySide - Whether to display small cards side by side
 * @returns {Promise<HTMLElement>} Created card element
 */
async function createArticleCard(
  article,
  type = "small",
  isSideBySide = false
) {
  const card = document.createElement("div");
  card.classList.add("article-card", "glass", type, "loading");
  if (isSideBySide) card.classList.add("side-by-side");

  // Define card HTML structure based on type
  if (type === "huge") {
    card.innerHTML = `
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
    card.innerHTML = `
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

  // Set article data attributes
  card.setAttribute("data-article-id", article.id || "");
  card.setAttribute("data-category", normalizeCategory(article.category || ""));

  // Populate card elements
  const img = card.querySelector(".article-image");
  const title = card.querySelector(".article-title");
  const meta = card.querySelector(".article-meta");
  img.dataset.src = article.image;
  img.alt = article.title || "Article Image";
  title.textContent = article.title || "Untitled Article";
  if (meta)
    meta.textContent = `${formatDate(article.date)} | ${article.category}`;

  // Lazy load image with IntersectionObserver
  const observer = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.addEventListener("load", () => card.classList.remove("loading"), {
            once: true,
          });
          observer.unobserve(img);
        }
      });
    },
    { rootMargin: "100px" }
  );
  observer.observe(img);

  return card;
}

/**
 * Populates an existing article card with data.
 * @param {HTMLElement} card - The card element to populate
 * @param {Object} article - Article data object
 */
async function populateArticleCard(card, article) {
  card.setAttribute("data-article-id", article.id || "");
  card.setAttribute("data-category", normalizeCategory(article.category || ""));
  card.classList.add("loading");

  const img = card.querySelector(".article-image");
  const title = card.querySelector(".article-title");
  const meta = card.querySelector(".article-meta");
  const author = card.querySelector(".article-author");

  img.src = "assets/images/placeholder.jpg";
  img.dataset.src = article.image;
  img.alt = article.title || "Article Image";
  img.setAttribute("loading", "lazy");
  title.textContent = article.title || "Untitled Article";
  if (meta)
    meta.textContent = `${formatDate(article.date)} | ${article.category}`;
  if (author) author.textContent = `By ${article.author || "Unknown Author"}`;

  // Lazy load image with IntersectionObserver
  const observer = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.addEventListener("load", () => card.classList.remove("loading"), {
            once: true,
          });
          observer.unobserve(img);
        }
      });
    },
    { rootMargin: "100px" }
  );
  observer.observe(img);
}

/**
 * Populates the main article view with data.
 * @param {Object} article - Article data object
 */
async function populateMainArticle(article) {
  const mainArticle = document.querySelector(".main-article");
  mainArticle.setAttribute(
    "data-category",
    normalizeCategory(article.category || "")
  );

  const img = mainArticle.querySelector(".main-article-image");
  const title = mainArticle.querySelector(".main-article-title");
  const author = mainArticle.querySelector(".main-article-author");
  const body = mainArticle.querySelector(".main-article-body");
  const tagsContainer = mainArticle.querySelector(".article-tags");

  img.src = await preloadImage(article.image);
  img.alt = article.title || "Article Image";
  img.setAttribute("loading", "lazy");
  title.textContent = article.title || "Untitled Article";
  author.textContent = `By ${article.author || "Unknown Author"}`;

  // Process article content
  const paragraphs = article.content
    ? article.content
        .split("</p>")
        .filter((p) => p.trim())
        .map((p) => p.replace(/style="[^"]*"/g, ""))
    : ["<p>No content available.</p>"];

  // Insert inline image if available
  if (article.inline_image) {
    const halfwayIndex = Math.ceil(paragraphs.length / 2);
    const inlineImage = `<img src="${await preloadImage(
      article.inline_image
    )}" alt="Inline image for ${
      article.title || "Article"
    }" class="inline-image" loading="lazy" />`;
    paragraphs.splice(halfwayIndex, 0, inlineImage);
  }

  body.innerHTML = paragraphs.join("");

  // Populate tags
  tagsContainer.innerHTML = "";
  const tags = Array.isArray(article.tags) ? article.tags.slice(0, 6) : [];
  tags.forEach((tag, index) => {
    const tagElement = document.createElement("span");
    tagElement.classList.add("tag");
    tagElement.setAttribute("data-tag-index", index);
    tagElement.textContent = tag;
    tagsContainer.appendChild(tagElement);
  });
}

// ============================================================================
// Article View and Navigation
// ============================================================================

/**
 * Gets random articles excluding a specific ID.
 * @param {string} excludeArticleId - ID of the article to exclude
 * @param {Array} allArticles - Array of all available articles
 * @returns {Array} Array of up to 3 random articles
 */
function getRandomArticles(excludeArticleId, allArticles) {
  const filteredArticles = allArticles.filter(
    (article) => article.id !== excludeArticleId
  );
  const shuffled = filteredArticles.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3);
}

/**
 * Displays the full article view for a specific article.
 * @param {string} articleId - ID of the article to display
 */
async function showArticleView(articleId) {
  lastLatestScrollY = window.scrollY;
  window.scrollTo(0, 0);

  // Hide bento grid and latest label
  document.querySelector(".bento-grid").style.display = "none";
  const latestLabel = document.querySelector(".category-label.latest-label");
  if (latestLabel) latestLabel.style.display = "none";

  // Show article view
  const articleView = document.querySelector(".article-view");
  articleView.classList.remove("hidden");

  const article = articlesData.find((a) => a.id === articleId);
  if (!article) return;

  await populateMainArticle(article);

  // Populate related articles
  const randomArticles = getRandomArticles(articleId, articlesData).slice(0, 2);
  const randomCards = articleView.querySelectorAll(
    ".random-grid .article-card"
  );
  for (let index = 0; index < randomCards.length; index++) {
    if (randomArticles[index]) {
      await populateArticleCard(randomCards[index], randomArticles[index]);
    } else {
      randomCards[index].style.display = "none";
    }
  }

  // Close button functionality
  const closeBtn = document.querySelector(".close-article");
  if (closeBtn) {
    closeBtn.onclick = () => {
      articleView.classList.add("hidden");
      document.querySelector(".bento-grid").style.display = "";
      if (latestLabel) latestLabel.style.display = "";
      window.scrollTo(0, lastLatestScrollY);
    };
  }
}

/**
 * Loads articles for a specific category.
 * @param {string} category - The category to load articles for
 */
async function loadCategory(category) {
  const stickyNav = document.querySelector(".sticky-wrapper-navcontainer");
  const wasSticky = stickyNav.classList.contains("is-sticky");

  const categoryTitle = document.getElementById("category-title");
  const bentoGrid = document.querySelector(".bento-grid");
  const hugeArticleCard = bentoGrid.querySelector(".article-card.huge");
  const smallGrid = bentoGrid.querySelector(".small-grid");
  const articleView = document.querySelector(".article-view");

  // Update category title
  const displayCategory = category.charAt(0).toUpperCase() + category.slice(1);
  categoryTitle.textContent =
    category === "latest" ? "Latest" : displayCategory;

  // Reset view
  smallGrid.innerHTML = "";
  bentoGrid.style.display = "";
  articleView.classList.add("hidden");
  document.querySelector(".category-label.latest-label").style.display = "";

  // Filter and sort articles
  let articles = articlesData;
  if (category !== "latest") {
    articles = articlesData.filter(
      (article) => normalizeCategory(article.category || "") === category
    );
  }
  articles = articles
    .slice(0, 5)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  // Populate huge card
  if (articles[0]) {
    await populateArticleCard(hugeArticleCard, articles[0]);
  }

  // Populate small cards
  for (let index = 0; index < 4; index++) {
    if (articles[index + 1]) {
      const isSideBySide = index < 2;
      const card = await createArticleCard(
        articles[index + 1],
        "small",
        isSideBySide
      );
      smallGrid.appendChild(card);
    }
  }

  // Add click listeners to article cards
  const allArticleCards = document.querySelectorAll(".article-card");
  allArticleCards.forEach((card) => {
    card.removeEventListener("click", handleArticleClick);
    card.addEventListener("click", handleArticleClick);
  });

  // Adjust scroll position
  if (wasSticky) {
    const navHeight = stickyNav.offsetHeight;
    window.scrollTo(0, navHeight + 20);
  } else {
    window.scrollTo(0, 0);
  }
}

/**
 * Loads search results based on user query.
 * @param {string} query - The search query
 */
async function loadSearchResults(query) {
  const categoryTitle = document.getElementById("category-title");
  const bentoGrid = document.querySelector(".bento-grid");
  const hugeArticleCard = bentoGrid.querySelector(".article-card.huge");
  const smallGrid = bentoGrid.querySelector(".small-grid");
  const articleView = document.querySelector(".article-view");

  // Update title with search query
  categoryTitle.textContent = ` ${query.toUpperCase()}`;

  // Reset view
  smallGrid.innerHTML = "";
  bentoGrid.style.display = "";
  articleView.classList.add("hidden");
  document.querySelector(".category-label.latest-label").style.display = "";

  // Filter articles by category or tags
  const normalizedQuery = query.toLowerCase().trim();
  const articles = articlesData
    .filter((article) => {
      const categoryMatch = normalizeCategory(article.category || "").includes(
        normalizedQuery
      );
      const tagsMatch =
        Array.isArray(article.tags) &&
        article.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery));
      return categoryMatch || tagsMatch;
    })
    .slice(0, 5)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  // Populate huge card
  if (articles[0]) {
    await populateArticleCard(hugeArticleCard, articles[0]);
  }

  // Populate small cards
  for (let index = 0; index < 4; index++) {
    if (articles[index + 1]) {
      const isSideBySide = index < 2;
      const card = await createArticleCard(
        articles[index + 1],
        "small",
        isSideBySide
      );
      smallGrid.appendChild(card);
    }
  }

  // Add click listeners to article cards
  const allArticleCards = document.querySelectorAll(".article-card");
  allArticleCards.forEach((card) => {
    card.removeEventListener("click", handleArticleClick);
    card.addEventListener("click", handleArticleClick);
  });
}

/**
 * Handles click events on article cards to display full article view.
 * @param {Event} e - The click event
 */
function handleArticleClick(e) {
  e.preventDefault();
  const articleId = e.currentTarget.getAttribute("data-article-id");
  if (articleId) showArticleView(articleId);
}

/**
 * Loads a random article, avoiding recently viewed ones.
 */
async function loadRandomArticle() {
  const availableArticles = articlesData.filter(
    (article) => !randomArticleHistory.includes(article.id)
  );

  if (availableArticles.length === 0) {
    randomArticleHistory = [];
    availableArticles.push(...articlesData);
  }

  const randomIndex = Math.floor(Math.random() * availableArticles.length);
  const randomArticle = availableArticles[randomIndex];
  randomArticleHistory.push(randomArticle.id);

  showArticleView(randomArticle.id);
}
