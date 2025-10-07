export function initParallaxHover() {
  // Detect device type and performance
  const isMobile = window.innerWidth < 1200;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isLowEndDevice =
    navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;

  // Disable only on low-end Android devices
  if (isMobile && !isIOS && isLowEndDevice) {
    console.log("Low-end Android detected, disabling parallax");
    return;
  }

  // Adjust intensity based on device
  const intensity = isMobile ? 0.01 : 0.02; // Half intensity on mobile

  const articleCards = document.querySelectorAll(
    ".article-card:not(.carousel-card):not(.most-read-card)"
  );

  articleCards.forEach((card) => {
    const image = card.querySelector(".article-image");
    if (!image) return;

    // Desktop: mousemove, Mobile: touch events
    if (!isMobile) {
      card.addEventListener("mousemove", (e) => {
        const rect = card.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const moveX = (centerX - e.clientX) * intensity;
        const moveY = (centerY - e.clientY) * intensity;

        image.style.transform = `translate(${moveX}px, ${moveY}px)`;
      });

      card.addEventListener("mouseleave", () => {
        image.style.transform = "translate(0px, 0px)";
      });
    } else {
      // Mobile: subtle parallax on scroll (lighter than hover)
      // Optional: can add touch-based parallax here if desired
    }
  });
}
