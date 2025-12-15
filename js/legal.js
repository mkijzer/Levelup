/* ============================================================================ */
/* legal.js - LEGAL PAGES SYSTEM */
/* ============================================================================ */
/* Description: Handles legal pages with JSON content loading */
/* Version: 1.0 */
/* Author: Mike */
/* ============================================================================ */

let legalData = null;

/**
 * Load legal content from JSON
 */
async function loadLegalData() {
  if (legalData) return legalData;

  try {
    const response = await fetch("legal-content.json");
    if (!response.ok) throw new Error("Failed to load legal content");
    legalData = await response.json();
    return legalData;
  } catch (error) {
    console.error("Error loading legal content:", error);
    return null;
  }
}

/**
 * Show a legal page by type
 */
export async function showLegalPage(pageType) {
  const data = await loadLegalData();
  if (!data || !data[pageType]) {
    console.error(`Legal page '${pageType}' not found`);
    return;
  }

  // Hide other views
  hideOtherViews();

  // Get legal page container
  const legalPageView = document.getElementById("legal-page-view");
  if (!legalPageView) {
    console.error("Legal page container not found");
    return;
  }

  // Populate content
  const container = legalPageView.querySelector(".container");
  populateLegalPage(container, data[pageType], pageType);

  // Show the page
  legalPageView.classList.remove("hidden");

  // Update URL
  history.pushState(
    { page: "legal", type: pageType },
    data[pageType].title,
    `#${pageType}`
  );

  console.log(`Legal page '${pageType}' loaded`);
}

/**
 * Hide other views when showing legal page
 */
function hideOtherViews() {
  const mainContent = document.getElementById("main-content-area");
  const categoryPageView = document.getElementById("category-page-view");
  const articleView = document.querySelector(".article-view");

  if (mainContent) mainContent.style.display = "none";
  if (categoryPageView) categoryPageView.classList.add("hidden");
  if (articleView) articleView.classList.add("hidden");
}

/**
 * Populate legal page with content from JSON
 */
function populateLegalPage(container, pageData, pageType) {
  container.innerHTML = `
    <article class="legal-content glass">
      <nav class="legal-nav">
        <a href="#" class="legal-back-link" data-action="back">← Back to Home</a>
      </nav>

      <header class="legal-header">
        <h1 class="legal-title">${pageData.title}</h1>
        <p class="legal-date">Last updated: ${pageData.lastUpdated}</p>
      </header>

      <div class="legal-body">
        ${renderSections(pageData.sections)}
      </div>

      <nav class="legal-footer-nav">
        <a href="#" class="legal-back-link" data-action="back">← Back to Home</a>
      </nav>
    </article>
  `;
}

/**
 * Render sections from JSON data
 */
function renderSections(sections) {
  return sections
    .map(
      (section) => `
    <section class="legal-section">
      <h2>${section.heading}</h2>
      ${section.content ? `<p>${section.content}</p>` : ""}
      ${
        section.list
          ? `<ul class="legal-list">${section.list
              .map((item) => `<li>${item}</li>`)
              .join("")}</ul>`
          : ""
      }
      ${section.additionalContent ? `<p>${section.additionalContent}</p>` : ""}
    </section>
  `
    )
    .join("");
}

/**
 * Hide legal page and return to main content
 */
export function hideLegalPage() {
  const legalPageView = document.getElementById("legal-page-view");
  if (legalPageView) {
    legalPageView.classList.add("hidden");
  }

  // Show main content
  const mainContent = document.getElementById("main-content-area");
  if (mainContent) {
    mainContent.style.display = "";
  }
}

/**
 * Setup legal page navigation
 */
export function setupLegalNavigation() {
  document.addEventListener("click", (e) => {
    if (e.target.matches(".legal-back-link")) {
      e.preventDefault();
      hideLegalPage();
      // Load home page
      if (window.loadCategory) {
        window.loadCategory("latest");
      }
    }
  });
}

// Export specific page functions for convenience
export const showPrivacyPolicy = () => showLegalPage("privacy-policy");
