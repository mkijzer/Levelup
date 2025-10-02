// Parallax hover effect for article images
export function initParallaxHover() {
  const articleCards = document.querySelectorAll(
    ".article-card:not(.most-read-card)"
  );

  articleCards.forEach((card) => {
    const image = card.querySelector(".article-image");
    if (!image) return;

    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const mouseX = e.clientX;
      const mouseY = e.clientY;

      // Calculate offset (opposite direction, scaled down)
      const moveX = (centerX - mouseX) * 0.02;
      const moveY = (centerY - mouseY) * 0.02;

      image.style.transform = `translate(${moveX}px, ${moveY}px)`;
    });

    card.addEventListener("mouseleave", () => {
      image.style.transform = "translate(0px, 0px) scale(1)";
    });
  });
}
