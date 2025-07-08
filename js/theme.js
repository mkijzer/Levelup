// ============================================================================
// theme.js - CLEANED VERSION
// ============================================================================
// Description: Theme management with better error handling and performance
// Version: 2.0 - Improved reliability and user experience
// ============================================================================

// ============================================================================
// Configuration
// ============================================================================
const THEME_STORAGE_KEY = "theme";
const DEFAULT_THEME = "dark";
const THEME_SELECTORS = "#theme-switch, #theme-switch-desktop";

// ============================================================================
// Theme Manager Class
// ============================================================================
class ThemeManager {
  constructor() {
    this.themeSwitches = [];
    this.currentTheme = DEFAULT_THEME;
    this.init();
  }

  init() {
    this.loadSavedTheme();
    this.findThemeSwitches();
    this.applyTheme(this.currentTheme);
    this.setupEventListeners();

    console.log(`Theme: Initialized with ${this.currentTheme} theme`);
  }

  loadSavedTheme() {
    try {
      this.currentTheme =
        localStorage.getItem(THEME_STORAGE_KEY) || DEFAULT_THEME;
    } catch (error) {
      console.warn("Theme: Cannot access localStorage, using default theme");
      this.currentTheme = DEFAULT_THEME;
    }
  }

  findThemeSwitches() {
    this.themeSwitches = Array.from(document.querySelectorAll(THEME_SELECTORS));

    if (this.themeSwitches.length === 0) {
      console.warn(
        "Theme: No theme switches found. Expected selectors:",
        THEME_SELECTORS
      );
    } else {
      console.log(`Theme: Found ${this.themeSwitches.length} theme switches`);
    }
  }

  setupEventListeners() {
    this.themeSwitches.forEach((switcher, index) => {
      if (!switcher) {
        console.warn(`Theme: Switch ${index} is null or undefined`);
        return;
      }

      switcher.addEventListener("change", () => {
        this.toggleTheme();
      });
    });
  }

  applyTheme(theme) {
    const isLight = theme === "light";

    try {
      // Apply theme to document
      if (isLight) {
        document.documentElement.classList.add("light-mode");
      } else {
        document.documentElement.classList.remove("light-mode");
      }

      // Update all switches
      this.themeSwitches.forEach((switcher) => {
        if (switcher) {
          switcher.checked = isLight;
        }
      });

      this.currentTheme = theme;
    } catch (error) {
      console.error("Theme: Error applying theme:", error);
    }
  }

  toggleTheme() {
    const newTheme = this.currentTheme === "light" ? "dark" : "light";

    this.applyTheme(newTheme);
    this.saveTheme(newTheme);

    // Dispatch custom event for other components
    this.dispatchThemeChange(newTheme);
  }

  saveTheme(theme) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (error) {
      console.warn("Theme: Cannot save to localStorage:", error);
    }
  }

  dispatchThemeChange(theme) {
    try {
      const event = new CustomEvent("themeChanged", {
        detail: { theme, previousTheme: this.currentTheme },
      });
      document.dispatchEvent(event);
    } catch (error) {
      console.warn("Theme: Cannot dispatch theme change event:", error);
    }
  }

  // Public API
  getCurrentTheme() {
    return this.currentTheme;
  }

  setTheme(theme) {
    if (theme === "light" || theme === "dark") {
      this.applyTheme(theme);
      this.saveTheme(theme);
    } else {
      console.warn(`Theme: Invalid theme "${theme}". Use "light" or "dark"`);
    }
  }
}

// ============================================================================
// Initialization
// ============================================================================
let themeManager = null;

function initializeTheme() {
  if (!themeManager) {
    themeManager = new ThemeManager();
  }
  return themeManager;
}

// Auto-initialize when DOM is ready
document.addEventListener("DOMContentLoaded", initializeTheme);

// Export for external use
export { initializeTheme, ThemeManager };
