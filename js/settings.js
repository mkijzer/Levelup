// ============================================================================
// settings.js - MINIMAL CSS-DRIVEN VERSION
// ============================================================================
// Description: Minimal JS - animations handled by CSS with persistent settings
// Version: 1.4 - Fixed close button functionality
// ============================================================================
document.addEventListener("DOMContentLoaded", () => {
  const settingsButton = document.querySelector(".nav-item.settings");
  const settingsModal = document.getElementById("settings-modal");
  const settingsBackdrop = document.getElementById("settings-backdrop");
  const closeBtn = document.getElementById("close-settings");

  // Font size selectbox options
  const fontOptions = document.querySelectorAll(".font-option");
  const readingWidthSelect = document.getElementById("reading-width-select");

  // Load saved settings on page load
  loadSavedFontSize();

  // Open settings
  if (settingsButton) {
    settingsButton.addEventListener("click", (e) => {
      e.preventDefault();
      openSettings();
    });
  }
  // Close button with animation
  if (closeBtn) {
    closeBtn.addEventListener("click", function () {
      this.classList.toggle("on");

      // Delay close to show animation
      setTimeout(() => {
        closeSettings();
      }, 300);
    });
  }

  const fontSizeSlider = document.getElementById("font-size-slider");
  const previewText = document.querySelector(".preview-text");

  // Load saved settings
  loadSavedFontSize();

  if (fontSizeSlider) {
    fontSizeSlider.addEventListener("input", (e) => {
      const sizes = ["small", "medium", "large"];
      const size = sizes[e.target.value];

      // Update preview
      if (previewText) {
        previewText.style.fontSize =
          size === "small"
            ? "var(--font-size-sm)"
            : size === "large"
            ? "var(--font-size-lg)"
            : "var(--font-size-base)";
      }

      applyFontSize(size);
    });
  }

  // Add click handlers for A buttons
  const labelButtons = document.querySelectorAll(".label-btn");
  labelButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const sizeValue = parseInt(btn.dataset.size);
      const sizes = ["small", "medium", "large"];
      const size = sizes[sizeValue];

      // Update slider position
      if (fontSizeSlider) {
        fontSizeSlider.value = sizeValue;
      }

      // Update preview
      if (previewText) {
        previewText.style.fontSize =
          size === "small"
            ? "var(--font-size-sm)"
            : size === "large"
            ? "var(--font-size-lg)"
            : "var(--font-size-base)";
      }

      applyFontSize(size);
    });
  });

  function loadSavedFontSize() {
    const savedSize = localStorage.getItem("fontSizePreference") || "medium";
    const sizeMap = { small: 0, medium: 1, large: 2 };

    if (fontSizeSlider) {
      fontSizeSlider.value = sizeMap[savedSize];
    }

    if (previewText) {
      previewText.style.fontSize =
        savedSize === "small"
          ? "var(--font-size-sm)"
          : savedSize === "large"
          ? "var(--font-size-lg)"
          : "var(--font-size-base)";
    }

    applyFontSize(savedSize);
  }

  function openSettings() {
    if (settingsModal) settingsModal.classList.add("active");
    if (settingsBackdrop) settingsBackdrop.classList.add("active");

    // Remove nav glass when settings opens
    const nav = document.querySelector(".nav-container");
    if (nav) {
      nav.classList.add("modal-open");
    }

    // Force close button to cross state
    if (closeBtn) {
      closeBtn.classList.add("on");
    }
  }

  function closeSettings() {
    if (settingsModal) settingsModal.classList.remove("active");
    if (settingsBackdrop) settingsBackdrop.classList.remove("active");

    // Restore nav glass when settings closes
    const nav = document.querySelector(".nav-container");
    if (nav) {
      nav.classList.remove("modal-open");
    }
  }

  function applyFontSize(size) {
    // Store the setting for future use
    localStorage.setItem("fontSizePreference", size);

    // Apply to currently open article (if any)
    const currentArticle = document.querySelector(
      ".main-article .article-body"
    );
    if (currentArticle) {
      currentArticle.classList.remove(
        "font-small",
        "font-medium",
        "font-large"
      );
      currentArticle.classList.add(`font-${size}`);
    }

    // Apply to all article bodies on the page
    document.querySelectorAll(".article-body").forEach((body) => {
      body.classList.remove("font-small", "font-medium", "font-large");
      body.classList.add(`font-${size}`);
    });
  }

  function applyReadingWidth(width) {
    const body = document.querySelector(".article-body");
    if (body) {
      body.classList.remove("width-narrow", "width-wide");
      body.classList.add(`width-${width}`);
    }
  }

  // Load saved font size on page load
  function loadSavedFontSize() {
    const savedSize = localStorage.getItem("fontSizePreference") || "medium";

    // Set the active option in settings
    document.querySelectorAll(".font-option").forEach((option) => {
      option.classList.remove("active");
      if (option.dataset.size === savedSize) {
        option.classList.add("active");
      }
    });

    // Apply the saved font size
    applyFontSize(savedSize);
  }

  // Close settings when clicking outside
  document.addEventListener("click", (e) => {
    // Check if settings modal is open
    if (settingsModal && settingsModal.classList.contains("active")) {
      // Check if click is outside settings modal and not on settings button
      if (
        !settingsModal.contains(e.target) &&
        !settingsButton.contains(e.target)
      ) {
        closeSettings();
      }
    }
  });

  // Close settings when navbar items are clicked
  document.querySelectorAll(".nav-item:not(.settings)").forEach((navItem) => {
    navItem.addEventListener("click", () => {
      if (settingsModal && settingsModal.classList.contains("active")) {
        closeSettings();
      }
    });
  });

  // Close on Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeSettings();
  });

  // Make applyFontSize available globally for when articles are loaded
  window.applySavedFontSize = function () {
    const savedSize = localStorage.getItem("fontSizePreference") || "medium";
    const articleBody = document.querySelector(".main-article .article-body");
    if (articleBody) {
      articleBody.classList.remove("font-small", "font-medium", "font-large");
      articleBody.classList.add(`font-${savedSize}`);
    }
  };
});
