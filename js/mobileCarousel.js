// ============================================================================
// mobileCarousel.js - MOBILE CAROUSEL FOR MOST READ
// ============================================================================

import { articlesData } from "./articleLoader.js";
import { formatDate, calculateReadingTime } from "./utils.js";

/**
 * Populates the mobile carousel with most read articles
 */
export function populateMobileCarousel() {
  const carouselTrack = document.getElementById("most-read-carousel");
  if (!carouselTrack || articlesData.length === 0) {
    return;
  }

  // Get 5 random articles
  const shuffled = [...articlesData].sort(() => Math.random() - 0.5);
  const selectedArticles = shuffled.slice(0, 5);

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
  let isScrolling = false;

  // Mouse wheel support for desktop
  track.addEventListener("wheel", (e) => {
    e.preventDefault();
    track.scrollLeft += e.deltaY;
  });

  // Mouse drag support for desktop dev tools
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

  // Parallax effect on scroll
  track.addEventListener("scroll", () => {
    if (!isScrolling) {
      requestAnimationFrame(() => {
        const cards = track.querySelectorAll(".carousel-card");

        cards.forEach((card) => {
          const cardRect = card.getBoundingClientRect();
          const trackRect = track.getBoundingClientRect();
          const cardCenter = cardRect.left + cardRect.width / 2;
          const trackCenter = trackRect.left + trackRect.width / 2;
          const distance = Math.abs(cardCenter - trackCenter);
          const maxDistance = trackRect.width / 2;

          // Better balance - visible effect but smoother edges
          let parallaxAmount = 0;
          if (distance < maxDistance * 0.9) {
            // Stop at 90% instead of 80%
            const normalizedDistance = distance / (maxDistance * 0.9);
            parallaxAmount = normalizedDistance * 16; // Middle ground: 16 instead of 12 or 20
          }

          const image = card.querySelector(".carousel-card-image");
          const content = card.querySelector(".carousel-card-content");

          if (image && content) {
            image.style.transform = `translateX(${parallaxAmount * 0.8}px)`; // 0.4 instead of 0.3
            content.style.transform = `translateY(${parallaxAmount * 0.5}px)`; // 0.25 instead of 0.2
          }
        });

        isScrolling = false;
      });
    }
    isScrolling = true;
  });

  // Set initial cursor
  track.style.cursor = "grab";
}

/**
 * Refresh carousel content
 */
export function refreshMobileCarousel() {
  populateMobileCarousel();
}
