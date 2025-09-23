// ============================================================================
// settings.js - MINIMAL CSS-DRIVEN VERSION
// ============================================================================
// Description: Minimal JS - animations handled by CSS
// Version: 1.2 - Added selectbox support
// ============================================================================
document.addEventListener("DOMContentLoaded", () => {
  const settingsButton = document.querySelector(".nav-item.settings");
  const settingsModal = document.getElementById("settings-modal");
  const settingsBackdrop = document.getElementById("settings-backdrop");
  const closeButton = document.querySelector(".close-settings-btn");

  // Font size selectbox options
  const fontOptions = document.querySelectorAll(".font-option");
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

  // Handle font size selectbox
  fontOptions.forEach((option) => {
    option.addEventListener("click", (e) => {
      // Remove active from all options
      fontOptions.forEach((opt) => opt.classList.remove("active"));
      // Add active to clicked option
      option.classList.add("active");
      // Apply font size
      applyFontSize(option.dataset.size);
    });
  });

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
