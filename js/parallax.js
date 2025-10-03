export function initParallaxHover() {
  // Only run on desktop
  if (window.innerWidth < 1200) return;

  // Target all article cards except carousel and most-read
  const articleCards = document.querySelectorAll(
    ".article-card:not(.carousel-card):not(.most-read-card)"
  );

  articleCards.forEach((card) => {
    const image = card.querySelector(".article-image");
    if (!image) return;

    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const moveX = (centerX - e.clientX) * 0.02;
      const moveY = (centerY - e.clientY) * 0.02;

      image.style.transform = `translate(${moveX}px, ${moveY}px)`;
    });

    card.addEventListener("mouseleave", () => {
      image.style.transform = "translate(0px, 0px)";
    });
  });
}
