// ============================================================================
// modal.js
// ============================================================================
// Description: Temporary script for debugging category modal visibility.
// Version: 1.0
// Author: [Your Name]
// Note: This script forces the modal to be visible for testing purposes.
// ============================================================================

// ============================================================================
// Modal Debugging
// ============================================================================

/**
 * Initializes modal debugging on DOM content load.
 */
document.addEventListener("DOMContentLoaded", () => {
  // Select category modal
  const categoryModal = document.getElementById("category-modal");
  console.log("Modal found:", categoryModal);
});

// ============================================================================
// Modal Toggle
// ============================================================================

/**
 * Toggles category modal visibility on category link click.
 */
const categoryLink = document.querySelector('.categories a[href="#ai"]');
if (categoryLink) {
  categoryLink.addEventListener("click", (e) => {
    e.preventDefault();
    console.log("Click works, modal should be visible");
  });
}
