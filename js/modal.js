// ============================================================================
// modal.js - CATEGORY MODAL ONLY
// ============================================================================
// Description: Category modal management - settings handled separately
// Version: 3.2 - Fixed all modal issues
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
    const categoryLink =
      document.querySelector('.nav-item a[href="#category"]') ||
      document.querySelector('.nav-item.category a[href="#category"]');
    return {
      categoryItem: categoryLink?.closest(".nav-item"),
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

    // FIXED: Simple toggle click handler with stopPropagation
    categoryItem.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (this.isModalVisible) {
        this.hideModal();
      } else {
        this.showModal();
      }
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
        e.stopPropagation();

        const link = item.querySelector("a");
        const href = link?.getAttribute("href");
        if (href) {
          const category = href.replace("#", "");

          // FIXED: Immediately hide modal and reset state
          this.forceHideModal();

          // FIXED: Import from navigation.js instead of data.js
          import("./navigation.js").then((module) => {
            module.switchToCategory(category);
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
    const { categoryModal } = this.elements;
    this.cancelScheduledHide();

    if (this.isModalVisible) {
      this.isModalVisible = false;
      categoryModal.classList.remove("active");
    }
  }

  // FIXED: Force hide modal without checking state
  forceHideModal() {
    const { categoryModal } = this.elements;
    this.cancelScheduledHide();
    this.isModalVisible = false;
    if (categoryModal) {
      categoryModal.classList.remove("active");
    }
  }

  // FIXED: Public method to reset modal state
  resetModal() {
    this.forceHideModal();
  }

  scheduleHide() {
    this.cancelScheduledHide();

    this.hideTimer = setTimeout(() => {
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

// FIXED: Reset modal after navigation
function resetModalAfterNavigation() {
  if (modalManager) {
    modalManager.resetModal();
  }
}

// Auto-initialize when DOM is ready
document.addEventListener("DOMContentLoaded", initializeModal);

// FIXED: Export everything needed
export {
  initializeModal,
  ModalManager,
  modalManager,
  resetModalAfterNavigation,
};
