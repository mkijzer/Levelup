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
  const closeButton = document.querySelector(".settings-close");

  // Open settings on click
  if (settingsButton) {
    settingsButton.addEventListener("click", (e) => {
      e.preventDefault();
      openSettings();
    });
  }

  // Close settings on X click
  if (closeButton) {
    closeButton.addEventListener("click", () => {
      closeSettings();
    });
  }

  // Close on backdrop click
  if (settingsBackdrop) {
    settingsBackdrop.addEventListener("click", () => {
      closeSettings();
    });
  }

  // Close on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeSettings();
    }
  });

  function openSettings() {
    if (settingsModal) settingsModal.classList.add("active");
    if (settingsBackdrop) settingsBackdrop.classList.add("active");
  }

  function closeSettings() {
    if (settingsModal) settingsModal.classList.remove("active");
    if (settingsBackdrop) settingsBackdrop.classList.remove("active");
    // Add delay before hiding completely
    setTimeout(() => {
      // Modal stays visible during slide down
    }, 400);
  }
});
