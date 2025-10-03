/**
 * ============================================================================
 * scroll-animations.js - SCROLL-TRIGGERED ANIMATIONS SYSTEM
 * ============================================================================
 * Description: Handles scroll-triggered animations using Intersection Observer API
 * Features: Quote grow animation, scroll line, smooth transitions, performance optimized
 * Version: 1.3 - Fixed single scroll listener with proper cleanup
 * Author: Mike
 * ============================================================================
 */

// Scroll line element
let scrollLine = null;

// Track active listeners for proper cleanup
let activeScrollListener = null;
let activeScrollTarget = null;

/**
 * Initialize all scroll animations
 */
export function initializeScrollAnimations() {
  setupQuoteAnimations();
  initScrollLine();
  setupScrollHandler();
  console.log("Scroll animations initialized");
}

/**
 * Setup quote grow-from-distance animations
 */
function setupQuoteAnimations() {
  // Find all quote containers
  const quoteContainers = document.querySelectorAll(".quote-container");

  if (quoteContainers.length === 0) {
    console.log("No quote containers found");
    return;
  }

  // Create intersection observer
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Quote is entering viewport - trigger grow animation
          entry.target.classList.add("animate-in");
          entry.target.classList.remove("animate-out");
        } else {
          // Quote is leaving viewport - reset for re-entry
          entry.target.classList.remove("animate-in");
          entry.target.classList.add("animate-out");
        }
      });
    },
    {
      // Trigger when 30% of the quote is visible
      threshold: 0.3,
      // No margin - trigger exactly when element intersects
      rootMargin: "0px",
    }
  );

  // Set initial state and observe each quote container
  quoteContainers.forEach((container) => {
    // Set initial hidden state
    container.classList.add("quote-initial");

    // Start observing
    observer.observe(container);
  });
}

/**
 * Initialize scroll line (desktop only)
 */
function initScrollLine() {
  if (window.innerWidth >= 1200) {
    // Create scroll line element
    scrollLine = document.createElement("div");
    scrollLine.className = "scroll-line";
    document.body.appendChild(scrollLine);
  }
}

/**
 * Update scroll line position and fade effect
 */
function updateScrollLine(
  scrollPercentage,
  scrollY,
  totalHeight,
  viewportHeight
) {
  if (!scrollLine) return;

  const thumbHeight = (viewportHeight / totalHeight) * viewportHeight;
  const thumbPosition =
    (scrollY * (viewportHeight - thumbHeight)) / (totalHeight - viewportHeight);

  scrollLine.style.setProperty("--thumb-height", `${thumbHeight}px`);
  scrollLine.style.setProperty("--thumb-position", `${thumbPosition}px`);

  // Exponential curve based on thumb size
  const thumbFactor = thumbHeight / viewportHeight; // 0.1 to 1.0
  const curve = 1 + thumbFactor * 2; // 1.1 to 3.0
  const scrollProgress = scrollY / (totalHeight - viewportHeight);
  const opacity = Math.min(0.4, Math.pow(scrollProgress, 1 / curve) * 0.4);

  scrollLine.style.opacity = opacity;
}

/**
 * Setup scroll event handler - only one listener at a time
 */
function setupScrollHandler() {
  let ticking = false;

  function handleScroll(event) {
    if (!ticking) {
      requestAnimationFrame(() => {
        // Determine scroll values based on scroll source
        let scrollY, totalHeight, viewportHeight;

        if (event.target === window || event.target === document) {
          // Window scroll (normal pages)
          scrollY = window.scrollY;
          totalHeight = document.documentElement.scrollHeight;
          viewportHeight = window.innerHeight;
        } else {
          // Category page container scroll
          const container = event.target;
          scrollY = container.scrollTop;
          totalHeight = container.scrollHeight;
          viewportHeight = container.clientHeight;
        }

        // Calculate scroll percentage
        const scrollPercentage = scrollY / (totalHeight - viewportHeight);

        // Update scroll line with correct values
        updateScrollLine(
          scrollPercentage,
          scrollY,
          totalHeight,
          viewportHeight
        );

        ticking = false;
      });
      ticking = true;
    }
  }

  // CRITICAL: Remove ALL possible existing listeners first
  if (activeScrollListener) {
    // Remove from the tracked target
    if (activeScrollTarget) {
      activeScrollTarget.removeEventListener("scroll", activeScrollListener);
    }
    // Also remove from both possible targets to be absolutely sure
    window.removeEventListener("scroll", activeScrollListener);
    const categoryView = document.querySelector(".category-page-view");
    if (categoryView) {
      categoryView.removeEventListener("scroll", activeScrollListener);
    }
  }

  // Reset tracking variables
  activeScrollListener = handleScroll;
  activeScrollTarget = null;

  // Check if we're on a category page
  const categoryView = document.querySelector(".category-page-view");
  const isOnCategoryPage =
    categoryView && !categoryView.classList.contains("hidden");

  if (isOnCategoryPage) {
    // Only listen to category page scroll
    categoryView.addEventListener("scroll", handleScroll, { passive: true });
    activeScrollTarget = categoryView;
    console.log("Scroll listener attached to category page");
  } else {
    // Only listen to window scroll
    window.addEventListener("scroll", handleScroll, { passive: true });
    activeScrollTarget = window;
    console.log("Scroll listener attached to window");
  }
}

/**
 * Cleanup function - call when page changes
 */
export function cleanupScrollAnimations() {
  // Remove active scroll listener from all possible targets
  if (activeScrollListener) {
    window.removeEventListener("scroll", activeScrollListener);
    const categoryView = document.querySelector(".category-page-view");
    if (categoryView) {
      categoryView.removeEventListener("scroll", activeScrollListener);
    }
  }

  // Reset tracking variables
  activeScrollListener = null;
  activeScrollTarget = null;

  // Remove animation classes from all quote containers
  const quoteContainers = document.querySelectorAll(".quote-container");
  quoteContainers.forEach((container) => {
    container.classList.remove("quote-initial", "animate-in", "animate-out");
  });

  // Remove scroll line
  if (scrollLine) {
    scrollLine.remove();
    scrollLine = null;
  }
}
