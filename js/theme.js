// ============================================================================
// theme.js
// ============================================================================
// Description: Manages light/dark theme switching and persistence.
// Version: 1.0
// Author: [Your Name]
// ============================================================================

// ============================================================================
// Theme Switching
// ============================================================================

/**
 * Initializes theme based on saved preference and sets up toggle listeners.
 */
const themeSwitches = document.querySelectorAll(
  "#theme-switch, #theme-switch-desktop"
);

// Apply saved theme immediately
const savedTheme = localStorage.getItem("theme") || "dark";
if (savedTheme === "light") {
  document.documentElement.classList.add("light-mode");
  themeSwitches.forEach((switcher) => (switcher.checked = true));
} else {
  document.documentElement.classList.remove("light-mode");
}

// Add event listener for all theme switches
themeSwitches.forEach((switcher) => {
  switcher.addEventListener("change", () => {
    document.documentElement.classList.toggle("light-mode");
    const newTheme = document.documentElement.classList.contains("light-mode")
      ? "light"
      : "dark";
    localStorage.setItem("theme", newTheme);
    // Sync all switches
    themeSwitches.forEach((s) => (s.checked = newTheme === "light"));
  });
});

// Log error if theme switches are not found
if (themeSwitches.length === 0) {
  console.error("Theme switch elements not found");
}
