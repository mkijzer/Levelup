// ============================================================================
// modal.js - CATEGORY MODAL ONLY
// ============================================================================
// Description: Category modal management - no settings functionality
// Version: 3.0 - Category modal only, settings handled separately
// ============================================================================

// ============================================================================
// Configuration
// ============================================================================
const MODAL_HIDE_DELAY = 150; // ms

// ============================================================================
// Modal Manager Class - Category Only
// ============================================================================
class ModalManager {
  constructor() {
    this.elements = {};
    this.isModalVisible = false;
    this.hideTimer = null;
    this.init();
  }

  init() {
    this.elements = this.getElements();

    if (!this.validateElements()) {
      console.warn("Modal: Required category elements not found");
      return;
    }

    this.setupEventListeners();
    this.hideModal(); // Ensure modal starts hidden

    console.log("Modal: Category modal initialized successfully");
  }

  getElements() {
    const categoryLink = document.querySelector(
      '.nav-item a[href="#category"]'
    );

    return {
      categoryItem: categoryLink?.parentElement,
      categoryModal: document.getElementById("category-modal"),
      categoryLink: categoryLink,
    };
  }

  validateElements() {
    const { categoryItem, categoryModal } = this.elements;
    return categoryItem && categoryModal;
  }

  setupEventListeners() {
    const { categoryItem, categoryModal } = this.elements;

    // Click to toggle modal
    categoryItem.addEventListener("click", (e) => {
      e.preventDefault();
      this.toggleModal();
    });

    // Hover events for desktop
    categoryItem.addEventListener("mouseenter", () => {
      this.showModal();
    });

    categoryItem.addEventListener("mouseleave", () => {
      this.scheduleHide();
    });

    categoryModal.addEventListener("mouseenter", () => {
      this.cancelScheduledHide();
    });

    categoryModal.addEventListener("mouseleave", () => {
      this.scheduleHide();
    });

    // Click outside to close
    document.addEventListener("click", (e) => {
      if (
        this.isModalVisible &&
        !categoryModal.contains(e.target) &&
        !categoryItem.contains(e.target)
      ) {
        this.hideModal();
      }
    });

    // Escape key to close
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.isModalVisible) {
        this.hideModal();
      }
    });

    // Setup category link clicks
    this.setupCategoryLinks();
  }

  setupCategoryLinks() {
    const categoryLinks = document.querySelectorAll(".modal-category-item a");

    categoryLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const href = link.getAttribute("href");

        if (href) {
          // Hide modal first
          this.hideModal();

          // Navigate to category
          window.location.hash = href;
        }
      });
    });
  }

  toggleModal() {
    if (this.isModalVisible) {
      this.hideModal();
    } else {
      this.showModal();
    }
  }

  showModal() {
    const { categoryModal } = this.elements;

    this.cancelScheduledHide();

    if (!this.isModalVisible) {
      categoryModal.style.display = "block";
      categoryModal.classList.remove("hidden");
      this.isModalVisible = true;
    }
  }

  hideModal() {
    const { categoryModal } = this.elements;

    this.cancelScheduledHide();

    if (this.isModalVisible) {
      categoryModal.style.display = "none";
      categoryModal.classList.add("hidden");
      this.isModalVisible = false;
    }
  }

  scheduleHide() {
    this.cancelScheduledHide();

    this.hideTimer = setTimeout(() => {
      // Check if still not hovering over modal or trigger
      if (!this.isHoveringModalArea()) {
        this.hideModal();
      }
    }, MODAL_HIDE_DELAY);
  }

  cancelScheduledHide() {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
  }

  isHoveringModalArea() {
    const { categoryItem, categoryModal } = this.elements;
    return categoryItem.matches(":hover") || categoryModal.matches(":hover");
  }
}

// ============================================================================
// Initialization
// ============================================================================
let modalManager = null;

function initializeModal() {
  if (!modalManager) {
    modalManager = new ModalManager();
  }
  return modalManager;
}

// Auto-initialize when DOM is ready
document.addEventListener("DOMContentLoaded", initializeModal);

// Export for external use
export { initializeModal, ModalManager };
