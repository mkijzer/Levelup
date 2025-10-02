/**
 * ============================================================================
 * scroll-animations.js - SCROLL-TRIGGERED ANIMATIONS SYSTEM
 * ============================================================================
 * Description: Handles scroll-triggered animations using Intersection Observer API
 * Features: Quote grow animation, scroll line, smooth transitions, performance optimized
 * Version: 1.1
 * Author: Mike
 * ============================================================================
 */

// Scroll line element
let scrollLine = null;

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
function updateScrollLine(scrollPercentage) {
  if (!scrollLine) return;

  // Calculate light position (starts at center, moves with scroll)
  const centerOffset = 0.5;
  const lightPosition = (centerOffset + (scrollPercentage - 0.5) * 0.8) * 100;

  // Smooth fade in on scroll
  if (scrollPercentage > 0) {
    scrollLine.classList.add("visible");
    const opacity = Math.min(0.4, scrollPercentage * 0.8); // Gradual increase
    scrollLine.style.opacity = opacity;
    scrollLine.style.filter = `blur(${Math.max(
      0,
      2 - scrollPercentage * 4
    )}px)`;
  } else {
    scrollLine.classList.remove("visible");
    scrollLine.style.opacity = 0;
    scrollLine.style.filter = "blur(2px)";
  }

  // Update light position
  scrollLine.style.setProperty("--light-position", `${lightPosition}%`);
}

/**
 * Setup scroll event handler
 */
function setupScrollHandler() {
  let ticking = false;

  function handleScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        // Calculate scroll percentage
        const scrollPercentage =
          window.scrollY /
          (document.documentElement.scrollHeight - window.innerHeight);

        // Update scroll line
        updateScrollLine(scrollPercentage);

        ticking = false;
      });
      ticking = true;
    }
  }

  // Add scroll event listener
  window.addEventListener("scroll", handleScroll, { passive: true });
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

  // Remove scroll line
  if (scrollLine) {
    scrollLine.remove();
    scrollLine = null;
  }
}
