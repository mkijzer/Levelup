// ============================================================================
// mobileCarousel.js - MOBILE CAROUSEL FOR MOST READ
// ============================================================================

import { articlesData } from "./articleLoader.js";
import { formatDate, calculateReadingTime } from "./utils.js";

/**
 * Populates the mobile carousel with most read articles
 * Uses the same daily cache as desktop to ensure consistency
 */
export function populateMobileCarousel() {
  const carouselTrack = document.getElementById("most-read-carousel");
  if (!carouselTrack || articlesData.length === 0) {
    return;
  }

  // Get today's date as a string (YYYY-MM-DD)
  const today = new Date().toISOString().split("T")[0];

  // Check if we have cached articles for today
  const cachedData = localStorage.getItem("mostReadCache");
  let selectedArticles;

  if (cachedData) {
    const cache = JSON.parse(cachedData);

    // If cache is from today, use cached article IDs
    if (cache.date === today) {
      selectedArticles = cache.articleIds
        .map((id) => articlesData.find((article) => article.id === id))
        .filter(Boolean); // Remove any articles that no longer exist
    }
  }

  // If no valid cache, generate new selection
  if (!selectedArticles || selectedArticles.length < 5) {
    const shuffled = [...articlesData].sort(() => Math.random() - 0.5);
    selectedArticles = shuffled.slice(0, 5);

    // Cache the selection for today
    localStorage.setItem(
      "mostReadCache",
      JSON.stringify({
        date: today,
        articleIds: selectedArticles.map((article) => article.id),
      })
    );
  }

  // Clear existing content
  carouselTrack.innerHTML = "";

  // Create cards
  selectedArticles.forEach((article) => {
    const card = createCarouselCard(article);
    carouselTrack.appendChild(card);
  });

  // Add touch/scroll parallax effect
  addParallaxEffect(carouselTrack);
}

/**
 * Creates a single carousel card
 */
function createCarouselCard(article) {
  const card = document.createElement("div");
  card.className = "carousel-card article-card";
  card.setAttribute("data-article-id", article.id);

  const imageUrl =
    article.inline_image || article.image || "assets/images/fallback_image.png";
  const readingTime = calculateReadingTime(article.content);

  card.innerHTML = `
    <img src="${imageUrl}" alt="${
    article.title
  }" class="carousel-card-image" loading="lazy">
    <div class="carousel-card-content">
      <p class="carousel-card-meta">${formatDate(
        article.date
      )} | ${readingTime}</p>
      <h3 class="carousel-card-title">${article.title}</h3>
    </div>
  `;

  return card;
}

/**
 * Adds parallax scrolling effect + better desktop support
 */
function addParallaxEffect(track) {
  // Detect device performance
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isLowEndDevice =
    navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;

  // Reduce intensity on low-end Android
  const shouldReduceEffects = !isIOS && isLowEndDevice;
  const parallaxMultiplier = shouldReduceEffects ? 0.5 : 1; // Half intensity on low-end

  let isScrolling = false;

  // Mouse wheel support for desktop
  track.addEventListener("wheel", (e) => {
    e.preventDefault();
    track.scrollLeft += e.deltaY;
  });

  // Mouse drag support for desktop
  let isMouseDown = false;
  let startX = 0;
  let scrollStart = 0;

  track.addEventListener("mousedown", (e) => {
    isMouseDown = true;
    startX = e.pageX;
    scrollStart = track.scrollLeft;
    track.style.cursor = "grabbing";
    e.preventDefault();
  });

  track.addEventListener("mouseleave", () => {
    isMouseDown = false;
    track.style.cursor = "grab";
  });

  track.addEventListener("mouseup", () => {
    isMouseDown = false;
    track.style.cursor = "grab";
  });

  track.addEventListener("mousemove", (e) => {
    if (!isMouseDown) return;
    e.preventDefault();
    const x = e.pageX;
    const walk = (x - startX) * 2;
    track.scrollLeft = scrollStart - walk;
  });

  // Optimized parallax effect on scroll
  track.addEventListener(
    "scroll",
    () => {
      if (isScrolling) return;

      isScrolling = true;
      requestAnimationFrame(() => {
        const cards = track.querySelectorAll(".carousel-card");
        const trackRect = track.getBoundingClientRect();
        const trackCenter = trackRect.left + trackRect.width / 2;

        cards.forEach((card) => {
          const cardRect = card.getBoundingClientRect();
          const cardCenter = cardRect.left + cardRect.width / 2;
          const distance = Math.abs(cardCenter - trackCenter);
          const maxDistance = trackRect.width / 2;
          const position = Math.min(distance / maxDistance, 1);

          // Reduced parallax calculations
          let parallaxAmount = 0;
          if (distance < maxDistance * 0.9) {
            const normalizedDistance = distance / (maxDistance * 0.9);
            parallaxAmount = normalizedDistance * 16 * parallaxMultiplier;
          }

          // Simplified effects - skip scale/brightness on low-end
          const image = card.querySelector(".carousel-card-image");
          const content = card.querySelector(".carousel-card-content");

          if (image && content) {
            if (shouldReduceEffects) {
              // Low-end: only basic parallax, no scale/brightness
              image.style.transform = `translateX(${parallaxAmount * 0.8}px)`;
              content.style.transform = `translateY(${parallaxAmount * 0.5}px)`;
            } else {
              // High-end: full effects
              const scale = 1.05 - position * 0.1;
              const brightness = 1 - position * 0.4;

              image.style.transform = `translateX(${
                parallaxAmount * 0.8
              }px) scale(${scale})`;
              image.style.filter = `brightness(${brightness})`;
              content.style.transform = `translateY(${parallaxAmount * 0.5}px)`;
            }
          }
        });

        isScrolling = false;
      });
    },
    { passive: true }
  );

  track.style.cursor = "grab";
}
/**
 * Refresh carousel content
 */
export function refreshMobileCarousel() {
  populateMobileCarousel();
}
