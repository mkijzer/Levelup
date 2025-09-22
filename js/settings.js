// ============================================================================
// settings.js - MINIMAL CSS-DRIVEN VERSION
// ============================================================================
// Description: Minimal JS - animations handled by CSS
// Version: 1.1 - Fixed CSS-first approach with proper element selection
// ============================================================================
document.addEventListener("DOMContentLoaded", () => {
  const settingsButton = document.querySelector(".nav-item.settings");
  const settingsModal = document.getElementById("settings-modal");
  const settingsBackdrop = document.getElementById("settings-backdrop");
  const closeButton = document.querySelector(".close-settings-btn");

  // Font size and reading width selects
  const fontSizeSelect = document.getElementById("font-size-select");
  const readingWidthSelect = document.getElementById("reading-width-select");

  // Open settings
  if (settingsButton) {
    settingsButton.addEventListener("click", (e) => {
      e.preventDefault();
      openSettings();
    });
  }

  // Close settings
  if (closeButton) {
    closeButton.addEventListener("click", closeSettings);
  }
  if (settingsBackdrop) {
    settingsBackdrop.addEventListener("click", closeSettings);
  }

  // Handle font size change
  if (fontSizeSelect) {
    fontSizeSelect.addEventListener("change", (e) => {
      applyFontSize(e.target.value);
    });
  }

  // Handle reading width change
  if (readingWidthSelect) {
    readingWidthSelect.addEventListener("change", (e) => {
      applyReadingWidth(e.target.value);
    });
  }

  function openSettings() {
    if (settingsModal) settingsModal.classList.add("active");
    if (settingsBackdrop) settingsBackdrop.classList.add("active");
    if (settingsButton) settingsButton.classList.add("active");
  }

  function closeSettings() {
    if (settingsModal) settingsModal.classList.remove("active");
    if (settingsBackdrop) settingsBackdrop.classList.remove("active");
    if (settingsButton) settingsButton.classList.remove("active");
  }

  function applyFontSize(size) {
    const body = document.querySelector(".main-article .article-body");
    if (body) {
      body.classList.remove("font-small", "font-medium", "font-large");
      body.classList.add(`font-${size}`);
    }
  }

  function applyReadingWidth(width) {
    const body = document.querySelector(".article-body");
    if (body) {
      body.classList.remove("width-narrow", "width-wide");
      body.classList.add(`width-${width}`);
    }
  }

  // Close on Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeSettings();
  });
});
