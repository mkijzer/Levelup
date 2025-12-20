document.addEventListener("DOMContentLoaded", () => {
  const carousel = document.querySelector(".desktop-carousel");
  const prevBtn = document.querySelector(".carousel-prev");
  const nextBtn = document.querySelector(".carousel-next");

  if (!carousel || !prevBtn || !nextBtn) return;

  const CARD_WIDTH = 288; // 280px card + 8px gap
  let currentCard = 0;
  let totalCards = 0;

  const updateButtons = () => {
    prevBtn.style.display = currentCard === 0 ? "none" : "flex";
    nextBtn.style.display = currentCard >= totalCards - 4 ? "none" : "flex";
  };

  const scrollToCard = (cardIndex) => {
    carousel.scrollTo({
      left: cardIndex * CARD_WIDTH,
      behavior: "smooth",
    });
  };

  const init = () => {
    const cards = carousel.querySelectorAll(".article-card");
    totalCards = cards.length;
    updateButtons();
  };

  prevBtn.addEventListener("click", () => {
    if (currentCard > 0) {
      currentCard--;
      scrollToCard(currentCard);
      updateButtons();
    }
  });

  nextBtn.addEventListener("click", () => {
    if (currentCard < totalCards - 4) {
      currentCard++;
      scrollToCard(currentCard);
      updateButtons();
    }
  });

  setTimeout(init, 500);
});
