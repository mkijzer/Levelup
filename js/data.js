const hamburgerMenu = document.querySelector(".hamburger-menu");
const mobileMenu = document.querySelector(".mobile-menu");

let menuTransitioning = false;

hamburgerMenu.addEventListener("click", () => {
  if (menuTransitioning) return;

  if (!mobileMenu.classList.contains("open")) {
    mobileMenu.style.display = "flex";
    requestAnimationFrame(() => {
      hamburgerMenu.classList.add("open");
      mobileMenu.classList.add("open");
    });
  } else {
    menuTransitioning = true;
    hamburgerMenu.classList.remove("open");
    mobileMenu.classList.remove("open");
    setTimeout(() => {
      mobileMenu.style.display = "none";
      menuTransitioning = false;
    }, 900);
  }
});

// Add click event to close menu on category selection
document.querySelectorAll(".mobile-menu .categories a").forEach((link) => {
  link.addEventListener("click", () => {
    menuTransitioning = true;
    hamburgerMenu.classList.remove("open");
    mobileMenu.classList.remove("open");
    setTimeout(() => {
      mobileMenu.style.display = "none";
      menuTransitioning = false;
    }, 900);
  });
});

if (!mobileMenu.classList.contains("open")) {
  mobileMenu.style.display = "none";
}

function normalizeCategory(category) {
  return category.toLowerCase().trim();
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function preloadImage(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = url;
    img.onload = () => resolve(url);
    img.onerror = () => resolve(url);
  });
}

async function createArticleCard(
  article,
  type = "small",
  isSideBySide = false
) {
  const card = document.createElement("div");
  card.classList.add("article-card", "glass", type);
  if (isSideBySide) card.classList.add("side-by-side");
  if (type === "huge") {
    card.innerHTML = `
      <div class="card-inner">
        <div class="article-image-wrapper">
          <img src="" alt="" class="article-image" />
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
          <img src="" alt="" class="article-image" />
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
  img.src = await preloadImage(article.image);
  img.alt = article.title || "Article Image";
  title.textContent = article.title || "Untitled Article";
  if (meta)
    meta.textContent = `${formatDate(article.date)} | ${article.category}`;
  return card;
}

async function populateArticleCard(card, article) {
  card.setAttribute("data-article-id", article.id || "");
  card.setAttribute("data-category", normalizeCategory(article.category || ""));
  const img = card.querySelector(".article-image");
  const title = card.querySelector(".article-title");
  const meta = card.querySelector(".article-meta");
  const author = card.querySelector(".article-author");

  img.src = await preloadImage(article.image);
  img.alt = article.title || "Article Image";
  title.textContent = article.title || "Untitled Article";
  if (meta)
    meta.textContent = `${formatDate(article.date)} | ${article.category}`;
  if (author) author.textContent = `By ${article.author || "Unknown Author"}`;
}

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
  title.textContent = article.title || "Untitled Article";
  author.textContent = `By ${article.author || "Unknown Author"}`;

  // Split content into paragraphs
  const paragraphs = article.content
    ? article.content.split("</p>").filter((p) => p.trim())
    : ["<p>No content available.</p>"];
  const halfwayIndex = Math.ceil(paragraphs.length / 2);
  const randomIndex = Math.floor(Math.random() * articlesData.length);
  const randomArticle = articlesData[randomIndex];
  const inlineImage = `<img src="${await preloadImage(
    randomArticle.image
  )}" alt="Inline image for ${randomArticle.title}" class="inline-image" />`;
  paragraphs.splice(halfwayIndex, 0, inlineImage);
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

function getRandomArticles(excludeArticleId, allArticles) {
  const filteredArticles = allArticles.filter(
    (article) => article.id !== excludeArticleId
  );
  const shuffled = filteredArticles.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3);
}

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

  const randomArticles = getRandomArticles(articleId, articlesData).slice(0, 2); // Limit to 2 articles
  const randomCards = articleView.querySelectorAll(
    ".random-grid .article-card"
  );
  for (let index = 0; index < randomCards.length; index++) {
    if (randomArticles[index]) {
      await populateArticleCard(randomCards[index], randomArticles[index]);
    } else {
      randomCards[index].style.display = "none"; // Hide extra cards if any
    }
  }

  const closeBtn = articleView.querySelector(".close-article");
  if (closeBtn) {
    closeBtn.onclick = () => {
      articleView.classList.add("hidden");
      document.querySelector(".bento-grid").style.display = "";
      if (latestLabel) latestLabel.style.display = "";
      window.scrollTo(0, lastLatestScrollY);
    };
  }
}

async function loadCategory(category) {
  const categoryTitle = document.getElementById("category-title");
  const bentoGrid = document.querySelector(".bento-grid");
  const hugeArticleCard = bentoGrid.querySelector(".article-card.huge");
  const smallGrid = bentoGrid.querySelector(".small-grid");
  const articleView = document.querySelector(".article-view");

  // categoryTitle.textContent = category.toUpperCase();

  smallGrid.innerHTML = "";
  bentoGrid.style.display = "";
  articleView.classList.add("hidden");
  document.querySelector(".category-label.latest-label").style.display = "";

  let articles = articlesData;
  if (category !== "latest") {
    articles = articlesData.filter(
      (article) => normalizeCategory(article.category) === category
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
}

async function loadSearchResults(query) {
  const categoryTitle = document.getElementById("category-title");
  const bentoGrid = document.querySelector(".bento-grid");
  const hugeArticleCard = bentoGrid.querySelector(".article-card.huge");
  const smallGrid = bentoGrid.querySelector(".small-grid");
  const articleView = document.querySelector(".article-view");

  categoryTitle.textContent = `SEARCH: ${query.toUpperCase()}`;

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

function handleArticleClick(e) {
  e.preventDefault();
  const articleId = e.currentTarget.getAttribute("data-article-id");
  if (articleId) showArticleView(articleId);
}

let randomArticleHistory = [];

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

let articlesData = [];

document.addEventListener("DOMContentLoaded", () => {
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
          if (category === "random") {
            loadRandomArticle();
          } else {
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
});

let lastLatestScrollY = 0;
