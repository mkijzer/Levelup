let isModalVisible = false;
let hideTimer = null;

// ============================================================================
function showModal() {
  const modal = document.getElementById("category-modal");
  console.log("showModal called, modal element found:", !!modal);
  if (!modal) return;

  clearTimeout(hideTimer);
  modal.classList.add("active");
  isModalVisible = true;

  // Remove nav glass when modal opens (Android optimization)
  const nav = document.querySelector(".nav-container");
  if (nav) {
    nav.classList.add("modal-open");
  }
}

function hideModal() {
  const modal = document.getElementById("category-modal");
  if (!modal) return;

  clearTimeout(hideTimer);
  modal.classList.remove("active");
  isModalVisible = false;

  // Restore nav glass when modal closes
  const nav = document.querySelector(".nav-container");
  if (nav) {
    nav.classList.remove("modal-open");
  }
}

function scheduleHide(delay = 150) {
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    const modal = document.getElementById("category-modal");
    const categoryButton = document.querySelector(".nav-item.category");
    if (!modal || !categoryButton) return;

    if (!modal.matches(":hover") && !categoryButton.matches(":hover")) {
      hideModal();
    }
  }, delay);
}

function safeClosest(element, selector) {
  if (!element || !element.closest) return null;
  return element.closest(selector);
}

// ============================================================================
function handleDocumentClick(e) {
  const target = e.target;

  const categoryButton = safeClosest(target, ".nav-item.category");
  if (categoryButton) {
    e.preventDefault();
    e.stopPropagation();
    console.log("Category button clicked, isModalVisible:", isModalVisible); // NEW LOG
    clearTimeout(hideTimer);
    isModalVisible ? hideModal() : showModal();
    return;
  }

  const modalItem = safeClosest(target, ".modal-category-item");
  if (modalItem) {
    e.preventDefault();
    e.stopPropagation();
    console.log("Category item clicked:", modalItem);

    const link = modalItem.querySelector("a");
    if (link) {
      const category = link.getAttribute("href").replace("#", "");
      console.log("Category to navigate:", category);
      hideModal();

      // Use dynamic import to call switchToCategory
      import("./navigation.js")
        .then((module) => {
          console.log("Import successful, calling switchToCategory");
          module.switchToCategory(category);
        })
        .catch((err) => console.error("Import failed:", err));
    } else {
      console.warn("No <a> tag found in modal item:", modalItem);
    }
    return;
  }

  const modal = document.getElementById("category-modal");
  if (
    isModalVisible &&
    modal &&
    !modal.contains(target) &&
    !safeClosest(target, ".nav-item.category")
  ) {
    hideModal();
  }
}

function handleDocumentMouseEnter(e) {
  const target = e.target;
  if (
    safeClosest(target, ".nav-item.category") ||
    safeClosest(target, "#category-modal")
  ) {
    clearTimeout(hideTimer);
  }
}

function handleDocumentMouseLeave(e) {
  const target = e.target;
  if (
    safeClosest(target, ".nav-item.category") ||
    safeClosest(target, "#category-modal")
  ) {
    scheduleHide();
  }
}

function handleKeydown(e) {
  if (e.key === "Escape" && isModalVisible) hideModal();
}

// Auto-close category modal on scroll
function setupScrollClose() {
  let isScrolling = false;

  const handleScroll = () => {
    if (isModalVisible) {
      hideModal();
    }
  };

  const handleTouchMove = () => {
    if (isModalVisible) {
      hideModal();
    }
  };

  // Remove existing listeners to prevent duplicates
  window.removeEventListener("scroll", handleScroll);
  document.removeEventListener("touchmove", handleTouchMove);

  // Add scroll listeners
  window.addEventListener("scroll", handleScroll, { passive: true });
  document.addEventListener("touchmove", handleTouchMove, { passive: true });
}

// Initialize scroll close functionality
setupScrollClose();

// ============================================================================
export function initializeModal() {
  document.removeEventListener("click", handleDocumentClick);
  document.removeEventListener("mouseenter", handleDocumentMouseEnter, true);
  document.removeEventListener("mouseleave", handleDocumentMouseLeave, true);
  document.removeEventListener("keydown", handleKeydown);

  document.addEventListener("click", handleDocumentClick);
  document.addEventListener("mouseenter", handleDocumentMouseEnter, true);
  document.addEventListener("mouseleave", handleDocumentMouseLeave, true);
  document.addEventListener("keydown", handleKeydown);

  console.log("Modal: Event delegation initialized");
}

document.addEventListener("DOMContentLoaded", initializeModal);
export { showModal, hideModal };
