/**
 * @file data.js
 * @description Handles data loading, article card creation, and interactive functionality for the SPA.
 * @version 1.0
 * @author [Your Name]
 */

/* ========================================================================== */
/* Global Variables and Constants */
/* ========================================================================== */

/**
 * Mobile menu element for toggling visibility.
 * @type {HTMLElement|null}
 */
const mobileMenu = document.querySelector(".mobile-menu");

let menuTransitioning = false; // Flag to prevent multiple menu transitions
let articlesData = []; // Array to store fetched article data
let randomArticleHistory = []; // Track viewed random articles
let lastLatestScrollY = 0; // Store scroll position for latest view

/* ========================================================================== */
/* Event Listeners and Initialization */
/* ========================================================================== */

/**
 * Initializes the application on DOM content load.
 * Fetches articles and quotes, sets up event listeners.
 */
document.addEventListener("DOMContentLoaded", () => {
  // Fetch articles data
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

      const articlesContainer = document.querySelector(".container");
      const categoryGrids =
        articlesContainer.querySelectorAll(".category-grid");
      const usedArticleIds = new Set();

      (async () => {
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

        loadContent();

        window.addEventListener("hashchange", loadContent);

        const randomLink = document.getElementById("random-link");
        if (randomLink) {
          randomLink.addEventListener("click", (e) => {
            e.preventDefault();
            loadRandomArticle();
          });
        }

        const mobileRandomLink = document.getElementById("mobile-random-link");
        if (mobileRandomLink) {
          mobileRandomLink.addEventListener("click", (e) => {
            e.preventDefault();
            loadRandomArticle();
          });
        }

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

  // Fetch quotes data
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
      const separatorQuote = document.querySelector(".separator-quote");
      const quoteText = separatorQuote.querySelector(".quote-text");
      const quoteAuthor = separatorQuote.querySelector(".quote-author");
      const randomIndex1 = Math.floor(Math.random() * data.length);
      quoteText.textContent = `"${data[randomIndex1].text}"`;
      quoteAuthor.textContent = `- ${data[randomIndex1].author}`;

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

  // Sticky navigation observer
  const stickyNav = document.querySelector(".sticky-wrapper-navcontainer");
  let stickyObserver = new IntersectionObserver(
    ([entry]) => {
      stickyNav.classList.toggle("is-sticky", !entry.isIntersecting);
    },
    { threshold: 1 }
  );
  stickyObserver.observe(stickyNav);
});
// Category modal toggle with dynamic positioning
const categoryLink = document.querySelector('.categories a[href="#ai"]');
const categoryModal = document.getElementById("category-modal");

if (categoryLink) {
  categoryLink.addEventListener("click", (e) => {
    e.preventDefault();

    // Get the category button's position
    const categoryButton = categoryLink.closest(".nav-item");
    const buttonRect = categoryButton.getBoundingClientRect();
    const modalContent = categoryModal.querySelector(".modal-content");

    // Calculate center position of the button
    const buttonCenter = buttonRect.left + buttonRect.width / 2;

    // Set modal position to align with button center
    modalContent.style.left = `${buttonCenter}px`;
    modalContent.style.transform = "translateX(-50%) translateY(20px)";

    categoryModal.classList.toggle("hidden");
  });
}

// Close modal when clicking outside
if (categoryModal) {
  categoryModal.addEventListener("click", (e) => {
    if (e.target === categoryModal) {
      categoryModal.classList.add("hidden");
    }
  });
}

/**
 * Toggles mobile menu on "more" link click.
 */
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

if (!mobileMenu.classList.contains("open")) {
  mobileMenu.style.display = "none";
}

/* ========================================================================== */
/* Utility Functions */
/* ========================================================================== */

/**
 * Normalizes a category string to lowercase and trimmed format.
 * @param {string} category - The category to normalize
 * @returns {string} Normalized category
 */
function normalizeCategory(category) {
  return category.toLowerCase().trim();
}

/**
 * Formats a date string into a readable format.
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
 * @returns {Promise<string>} Resolved URL or fallback
 */
function preloadImage(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = url;
    img.onload = () => resolve(url);
    img.onerror = () => resolve("assets/images/fallback_image.png");
  });
}

/* ========================================================================== */
/* Article Card Management */
/* ========================================================================== */

/**
 * Creates an article card element with loading state.
 * @param {Object} article - Article data
 * @param {string} type - Card type (small/huge)
 * @param {boolean} isSideBySide - Whether to display side by side
 * @returns {HTMLElement} Created card element
 */
async function createArticleCard(
  article,
  type = "small",
  isSideBySide = false
) {
  const card = document.createElement("div");
  card.classList.add("article-card", "glass", type, "loading");
  if (isSideBySide) card.classList.add("side-by-side");
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
  card.setAttribute("data-article-id", article.id || "");
  card.setAttribute("data-category", normalizeCategory(article.category || ""));
  const img = card.querySelector(".article-image");
  const title = card.querySelector(".article-title");
  const meta = card.querySelector(".article-meta");
  img.dataset.src = article.image;
  img.alt = article.title || "Article Image";
  title.textContent = article.title || "Untitled Article";
  if (meta)
    meta.textContent = `${formatDate(article.date)} | ${article.category}`;

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
 * @param {Object} article - Article data
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
 * @param {Object} article - Article data
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

  const paragraphs = article.content
    ? article.content
        .split("</p>")
        .filter((p) => p.trim())
        .map((p) => p.replace(/style="[^"]*"/g, ""))
    : ["<p>No content available.</p>"];

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

/* ========================================================================== */
/* Article View and Navigation */
/* ========================================================================== */

/**
 * Gets random articles excluding a specific ID.
 * @param {string} excludeArticleId - ID to exclude
 * @param {Array} allArticles - All available articles
 * @returns {Array} Random articles
 */
function getRandomArticles(excludeArticleId, allArticles) {
  const filteredArticles = allArticles.filter(
    (article) => article.id !== excludeArticleId
  );
  const shuffled = filteredArticles.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3);
}

/**
 * Displays the full article view.
 * @param {string} articleId - ID of the article to show
 */
async function showArticleView(articleId) {
  lastLatestScrollY = window.scrollY;
  window.scrollTo(0, 0);

  document.querySelector(".bento-grid").style.display = "none";
  const latestLabel = document.querySelector(".category-label.latest-label");
  if (latestLabel) latestLabel.style.display = "none";

  const articleView = document.querySelector(".article-view");
  articleView.classList.remove("hidden");

  const article = articlesData.find((a) => a.id === articleId);
  if (!article) return;

  await populateMainArticle(article);

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
 * @param {string} category - Category to load
 */
async function loadCategory(category) {
  const stickyNav = document.querySelector(".sticky-wrapper-navcontainer");
  const wasSticky = stickyNav.classList.contains("is-sticky");

  const categoryTitle = document.getElementById("category-title");
  const bentoGrid = document.querySelector(".bento-grid");
  const hugeArticleCard = bentoGrid.querySelector(".article-card.huge");
  const smallGrid = bentoGrid.querySelector(".small-grid");
  const articleView = document.querySelector(".article-view");

  const displayCategory = category.charAt(0).toUpperCase() + category.slice(1);
  categoryTitle.textContent =
    category === "latest" ? "Latest" : displayCategory;

  smallGrid.innerHTML = "";
  bentoGrid.style.display = "";
  articleView.classList.add("hidden");
  document.querySelector(".category-label.latest-label").style.display = "";

  let articles = articlesData;
  if (category !== "latest") {
    articles = articlesData.filter(
      (article) => normalizeCategory(article.category || "") === category
    );
  }
  articles = articles
    .slice(0, 5)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  if (articles[0]) {
    await populateArticleCard(hugeArticleCard, articles[0]);
  }

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

  const allArticleCards = document.querySelectorAll(".article-card");
  allArticleCards.forEach((card) => {
    card.removeEventListener("click", handleArticleClick);
    card.addEventListener("click", handleArticleClick);
  });

  if (wasSticky) {
    const navHeight = stickyNav.offsetHeight;
    window.scrollTo(0, navHeight + 20);
  } else {
    window.scrollTo(0, 0);
  }
}

/**
 * Loads search results based on query.
 * @param {string} query - Search query
 */
async function loadSearchResults(query) {
  const categoryTitle = document.getElementById("category-title");
  const bentoGrid = document.querySelector(".bento-grid");
  const hugeArticleCard = bentoGrid.querySelector(".article-card.huge");
  const smallGrid = bentoGrid.querySelector(".small-grid");
  const articleView = document.querySelector(".article-view");

  categoryTitle.textContent = ` ${query.toUpperCase()}`;

  smallGrid.innerHTML = "";
  bentoGrid.style.display = "";
  articleView.classList.add("hidden");
  document.querySelector(".category-label.latest-label").style.display = "";

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

  if (articles[0]) {
    await populateArticleCard(hugeArticleCard, articles[0]);
  }

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

  const allArticleCards = document.querySelectorAll(".article-card");
  allArticleCards.forEach((card) => {
    card.removeEventListener("click", handleArticleClick);
    card.addEventListener("click", handleArticleClick);
  });
}

/**
 * Handles click events on article cards.
 * @param {Event} e - Click event
 */
function handleArticleClick(e) {
  e.preventDefault();
  const articleId = e.currentTarget.getAttribute("data-article-id");
  if (articleId) showArticleView(articleId);
}

/**
 * Loads a random article.
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
