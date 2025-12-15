// ============================================================================
// navigation.js - NAVIGATION & ROUTING
// ============================================================================
// Version: 2.5 - FIXED HISTORY + RANDOM + ACTIVE NAV
// ============================================================================

import { loadCategory, loadCategoryPage, loadRandomArticle } from "./data.js";
import { getRandomArticle, showArticleView } from "./articleView.js";
import { SEO } from "./seo.js";
import { showPrivacyPolicy, setupLegalNavigation } from "./legal.js";

let currentCategory = "latest";
let isInCategoryPage = true;

export function getCurrentCategory() {
  return currentCategory;
}
export function setCurrentCategory(category) {
  currentCategory = category;
}
export function getIsInCategoryPage() {
  return isInCategoryPage;
}
export function setIsInCategoryPage(state) {
  isInCategoryPage = state;
}

export function setActiveNav(category) {
  document.querySelectorAll(".nav-item, .desktop-nav-item").forEach((item) => {
    item.classList.remove("active");
  });

  if (category === "latest") {
    document
      .querySelector('.nav-item a[href="#latest"]')
      ?.closest(".nav-item")
      ?.classList.add("active");
    document
      .querySelector('.desktop-nav-item[href="#latest"]')
      ?.classList.add("active");
  } else if (category === "random") {
    document
      .querySelector('.nav-item a[href="#random"]')
      ?.closest(".nav-item")
      ?.classList.add("active");
    document
      .querySelector('.desktop-nav-item[href="#random"]')
      ?.classList.add("active");
  } else {
    document.querySelector(".nav-item.category")?.classList.add("active");
    document
      .querySelector(`.desktop-nav-item[href="#${category}"]`)
      ?.classList.add("active");
  }
}

export function setupNavigation() {
  window.addEventListener("hashchange", handleHashChange);
  window.addEventListener("popstate", handlePopState);

  document.querySelectorAll(".nav-item").forEach((navItem) => {
    navItem.addEventListener("click", handleNavigationClick);
  });

  document.querySelectorAll(".desktop-nav-item").forEach((link) => {
    link.addEventListener("click", handleNavigationClick);
  });

  setActiveNav("latest");
}

function handlePopState(event) {
  const state = event.state;

  // FIXED: Handle article cards (no history state)
  const hash = window.location.hash.slice(1);
  if (hash.includes("/")) {
    const articleId = hash.split("/")[1];
    if (articleId) {
      showArticleView(articleId);
      return;
    }
  }

  if (state && state.articleId) {
    showArticleView(state.articleId);
    setActiveNav(state.category || "latest");
    return;
  }

  if (state && state.category) {
    exitCategoryPage();
    loadCategory(state.category);
    setActiveNav(state.category);
    return;
  }

  // Fallback to latest
  exitCategoryPage();
  loadCategory("latest");
  setActiveNav("latest");
}

function handleHashChange() {
  const hash = window.location.hash.slice(1);
  const category = hash || "latest";

  sessionStorage.removeItem("fromSearch");

  const articleView = document.querySelector(".article-view");
  if (articleView && !articleView.classList.contains("hidden")) return;

  exitCategoryPage();
  loadCategory(category);
  setActiveNav(category);
}

function handleNavigationClick(e) {
  e.preventDefault();

  if (window.searchManager?.isSearchActive) {
    window.searchManager.closeSearch();
  }

  let href;
  if (e.currentTarget.classList.contains("desktop-nav-item")) {
    href = e.currentTarget.getAttribute("href");
  } else {
    const link = e.currentTarget.querySelector("a");
    if (!link) return;
    href = link.getAttribute("href");
  }

  const category = href.replace("#", "");

  if (href === "#settings" || href === "#category") return;

  setActiveNav(category);

  if (category === "random") {
    setCurrentCategory("random"); // FIXED: Set FIRST
    exitCategoryPage();
    const randomArticle = getRandomArticle();
    showArticleView(randomArticle.id); // FIXED: Call FIRST
    history.pushState(
      { category: "random", articleId: randomArticle.id },
      "",
      `#random/${randomArticle.id}`
    );

    const randomNavItem = document
      .querySelector('.nav-item a[href="#random"]')
      ?.closest(".nav-item");
    if (randomNavItem) {
      randomNavItem.setAttribute("data-random-clicked", "true");
      setTimeout(
        () => randomNavItem.removeAttribute("data-random-clicked"),
        600
      );
    }
  } else if (category === "privacy-policy") {
    showPrivacyPolicy();
  } else if (category === "latest") {
    exitCategoryPage();
    history.pushState({ category: "latest" }, "", "#latest");
    loadCategory("latest");
  } else {
    exitCategoryPage();
    history.pushState({ category: category }, "", `#${category}`);
    if (window.innerWidth >= 768) {
      loadCategoryPage(category);
    } else {
      loadCategory(category);
    }
  }
}

export function updateMobileNavigation(category) {
  setActiveNav(category);
}
export function updateDesktopNavigation(category) {
  setActiveNav(category);
}

export function switchToCategory(category) {
  isInCategoryPage = false;
  document.querySelector(".article-view")?.classList.add("hidden");
  document.querySelector(".category-article-view")?.classList.add("hidden");

  document
    .querySelector(".category-hero-grid")
    ?.style.setProperty("display", "");
  document
    .querySelector(".category-articles-list")
    ?.style.setProperty("display", "");
  document.querySelector(".load-more-button")?.style.setProperty("display", "");

  setActiveNav(category);
  loadCategoryPage(category);

  // Update SEO meta tags for category page
  SEO.updateMeta({
    title: `${
      category.charAt(0).toUpperCase() + category.slice(1)
    } Articles - LevelUpOrDieTrying`,
    description: `Latest ${category} articles and insights from LevelUpOrDieTrying`,
    type: "website",
  });
}

export function exitCategoryPage() {
  const categoryPageView = document.getElementById("category-page-view");
  const mainContent = document.getElementById("main-content-area");

  if (categoryPageView && !categoryPageView.classList.contains("hidden")) {
    categoryPageView.classList.add("hidden");
    document.body.style.overflow = "";
    mainContent?.style.setProperty("display", "");
  }
  isInCategoryPage = false;
}
