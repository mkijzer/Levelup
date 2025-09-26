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
    track.classList.add("carousel-grabbing");
    e.preventDefault();
  });

  track.addEventListener("mouseleave", () => {
    isMouseDown = false;
    track.classList.remove("carousel-grabbing");
    track.classList.add("carousel-grab");
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
        const trackRect = track.getBoundingClientRect();
        const trackCenter = trackRect.left + trackRect.width / 2;

        cards.forEach((card) => {
          const cardRect = card.getBoundingClientRect();
          const cardCenter = cardRect.left + cardRect.width / 2;
          const distance = Math.abs(cardCenter - trackCenter);
          const maxDistance = trackRect.width / 2;

          // Position: 0 = center, 1 = off-screen
          const position = Math.min(distance / maxDistance, 1);

          // Parallax movement
          let parallaxAmount = 0;
          if (distance < maxDistance * 0.9) {
            const normalizedDistance = distance / (maxDistance * 0.9);
            parallaxAmount = normalizedDistance * 16;
          }

          // Scale: 1.05 at center, 0.95 at edges
          const scale = 1.05 - position * 0.1;

          // Brightness: 1 at center, 0.6 at edges (darker when not visible)
          const brightness = 1 - position * 0.4;

          const image = card.querySelector(".carousel-card-image");
          const content = card.querySelector(".carousel-card-content");

          if (image && content) {
            image.style.transform = `translateX(${
              parallaxAmount * 0.8
            }px) scale(${scale})`;
            image.style.filter = `brightness(${brightness})`;
            content.style.transform = `translateY(${parallaxAmount * 0.5}px)`;
          }
        });

        isScrolling = false;
      });
    }
    isScrolling = true;
  });

  track.style.cursor = "grab";
}

/**
 * Refresh carousel content
 */
export function refreshMobileCarousel() {
  populateMobileCarousel();
}
