// ============================================================================
// modal.js - CATEGORY MODAL ONLY
// ============================================================================
// Description: Category modal management - settings handled separately
// Version: 3.1 - Fixed CSS-driven animations
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
      categoryItem: categoryLink?.parentElement?.parentElement,
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
    const categoryItems = document.querySelectorAll(".modal-category-item");

    categoryItems.forEach((item) => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        const link = item.querySelector("a");
        const href = link?.getAttribute("href");

        if (href) {
          // Get category name from href (#health -> health)
          const category = href.replace("#", "");

          // Hide modal first
          this.hideModal();

          // Load category page instead of changing hash
          import("./data.js").then((module) => {
            module.loadCategoryPage(category);
          });
        }
      });
    });
  }

  showModal() {
    const { categoryModal } = this.elements;
    this.cancelScheduledHide();

    if (!this.isModalVisible) {
      categoryModal.classList.add("active");
      this.isModalVisible = true;
    }
  }

  hideModal() {
    // Change this to add a delay before hiding
    const { categoryModal } = this.elements;
    this.cancelScheduledHide();

    if (this.isModalVisible) {
      categoryModal.classList.remove("active");
      // Add delay to match CSS transition
      setTimeout(() => {
        this.isModalVisible = false;
      }, 400); // Match CSS transition duration
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
