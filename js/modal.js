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
  console.log(
    "Modal set to visible, class active:",
    modal.classList.contains("active")
  );
  console.log("Modal display style:", window.getComputedStyle(modal).display);
  modal.style.display = "flex !important"; // TEMPORARY DEBUG
  console.log("Forced display style:", window.getComputedStyle(modal).display); // NEW LOG
}
function hideModal() {
  const modal = document.getElementById("category-modal");
  if (!modal) return;

  clearTimeout(hideTimer);
  modal.classList.remove("active");
  isModalVisible = false;
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
