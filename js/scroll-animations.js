/**
 * ============================================================================
 * scroll-animations.js - SCROLL-TRIGGERED ANIMATIONS SYSTEM
 * ============================================================================
 * Description: Handles scroll-triggered animations using Intersection Observer API
 * Features: Quote grow animation, smooth transitions, performance optimized
 * Version: 1.0
 * Author: Mike
 * ============================================================================
 */

/**
 * Initialize all scroll animations
 */
export function initializeScrollAnimations() {
  setupQuoteAnimations();
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
 * Cleanup function - call when page changes
 */
export function cleanupScrollAnimations() {
  // Remove animation classes from all quote containers
  const quoteContainers = document.querySelectorAll(".quote-container");
  quoteContainers.forEach((container) => {
    container.classList.remove("quote-initial", "animate-in", "animate-out");
  });
}
