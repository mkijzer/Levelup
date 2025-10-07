// ============================================================================
// scrollManager.js - UNIFIED SCROLL PERFORMANCE MANAGER
// ============================================================================
// Description: Single optimized scroll handler for all scroll-based features
// Replaces multiple scroll listeners with one efficient system
// ============================================================================

class ScrollManager {
  constructor() {
    // Performance optimization: cache all DOM elements
    this.elements = {
      header: null,
      navbar: null,
      categoryView: null,
      scrollLine: null,
      carouselTrack: null,
      quoteContainers: [],
    };

    // Scroll state tracking
    this.state = {
      lastScrollY: 0,
      isScrolling: false,
      scrollTimeout: null,
      touchTimeout: null,
      ticking: false,
    };

    // Feature flags - enable/disable features dynamically
    this.features = {
      headerBehavior: true,
      scrollAnimations: true,
      carouselParallax: true,
      modalAutoClose: true,
    };

    // Performance settings
    this.settings = {
      scrollThreshold: 15, // Minimum scroll distance to trigger header changes
      headerShowDelay: 500, // Delay before showing header when scroll stops
      touchEndDelay: 500, // Delay for touch end header show
    };

    this.activeTarget = null;
    this.boundHandleScroll = this.handleScroll.bind(this);

    this.initialize();
  }

  /**
   * Initialize the scroll manager
   */
  initialize() {
    this.cacheElements();
    this.setupScrollListener();
    this.optimizeElements();
  }

  /**
   * Cache all DOM elements to avoid repeated queries
   */
  cacheElements() {
    this.elements.header = document.querySelector(
      ".sticky-wrapper-navcontainer"
    );
    this.elements.navbar = document.querySelector(".nav-container");
    this.elements.categoryView = document.querySelector(".category-page-view");
    this.elements.carouselTrack = document.getElementById("most-read-carousel");
    this.elements.quoteContainers =
      document.querySelectorAll(".quote-container");

    // Initialize scroll line for desktop
    if (window.innerWidth >= 1200) {
      this.initScrollLine();
    }
  }

  /**
   * Add CSS optimizations for better performance
   */
  optimizeElements() {
    // Add will-change to elements that will be transformed
    if (this.elements.header) {
      this.elements.header.style.willChange = "transform";
    }

    if (this.elements.carouselTrack) {
      const cards = this.elements.carouselTrack.querySelectorAll(
        ".carousel-card-image"
      );
      cards.forEach((card) => {
        card.style.willChange = "transform";
      });
    }
  }

  /**
   * Setup optimized scroll listener with proper cleanup
   */
  setupScrollListener() {
    // Clean up any existing listeners
    this.cleanup();

    // Determine scroll target
    const isOnCategoryPage =
      this.elements.categoryView &&
      !this.elements.categoryView.classList.contains("hidden");

    this.activeTarget = isOnCategoryPage ? this.elements.categoryView : window;

    // Add single optimized listener with passive flag
    this.activeTarget.addEventListener("scroll", this.boundHandleScroll, {
      passive: true,
    });

    // Touch events for mobile header behavior
    if (this.features.headerBehavior) {
      window.addEventListener("touchend", this.handleTouchEnd.bind(this), {
        passive: true,
      });
    }
  }

  /**
   * Main scroll handler - processes all scroll-based features
   */
  handleScroll(event) {
    // Use single RAF for all scroll operations
    if (!this.state.ticking) {
      requestAnimationFrame(() => {
        this.processScrollEffects(event);
        this.state.ticking = false;
      });
      this.state.ticking = true;
    }
  }

  /**
   * Process all scroll effects in one RAF callback
   */
  processScrollEffects(event) {
    // Get scroll values based on target
    const scrollData = this.getScrollData(event);

    // Execute enabled features
    if (this.features.headerBehavior) {
      this.updateHeaderBehavior(scrollData);
    }

    if (this.features.scrollAnimations && this.elements.scrollLine) {
      this.updateScrollLine(scrollData);
    }

    if (this.features.carouselParallax && this.elements.carouselTrack) {
      this.updateCarouselParallax();
    }

    if (this.features.modalAutoClose) {
      this.handleModalAutoClose();
    }

    // Update state
    this.state.lastScrollY = scrollData.scrollY;
  }

  /**
   * Get scroll data from event target
   */
  getScrollData(event) {
    let scrollY, totalHeight, viewportHeight;

    if (event.target === window || event.target === document) {
      scrollY = window.scrollY;
      totalHeight = document.documentElement.scrollHeight;
      viewportHeight = window.innerHeight;
    } else {
      const container = event.target;
      scrollY = container.scrollTop;
      totalHeight = container.scrollHeight;
      viewportHeight = container.clientHeight;
    }

    return {
      scrollY,
      totalHeight,
      viewportHeight,
      scrollPercentage: scrollY / (totalHeight - viewportHeight),
    };
  }

  /**
   * Update header show/hide behavior
   */
  updateHeaderBehavior(scrollData) {
    if (!this.elements.header) return;

    const scrollDifference = Math.abs(
      scrollData.scrollY - this.state.lastScrollY
    );

    // Add scrolling class for visual feedback
    this.elements.header.classList.add("scrolling");
    if (this.elements.navbar) {
      this.elements.navbar.classList.add("scrolling");
    }

    // Only process significant scroll changes
    if (scrollDifference > this.settings.scrollThreshold) {
      if (
        scrollData.scrollY > this.state.lastScrollY &&
        scrollData.scrollY > 50
      ) {
        // Scrolling down - hide header
        this.elements.header.classList.add("hide-header");
      } else if (scrollData.scrollY < this.state.lastScrollY) {
        // Scrolling up - show header
        this.elements.header.classList.remove("hide-header");
      }
    }

    // Schedule header cleanup when scrolling stops
    this.scheduleHeaderCleanup();
  }

  /**
   * Schedule header class cleanup when scrolling stops
   */
  scheduleHeaderCleanup() {
    clearTimeout(this.state.scrollTimeout);
    this.state.scrollTimeout = setTimeout(() => {
      if (this.elements.header) {
        this.elements.header.classList.remove("hide-header", "scrolling");
      }
      if (this.elements.navbar) {
        this.elements.navbar.classList.remove("scrolling");
      }
    }, this.settings.headerShowDelay);
  }

  /**
   * Handle touch end events
   */
  handleTouchEnd() {
    clearTimeout(this.state.touchTimeout);
    this.state.touchTimeout = setTimeout(() => {
      if (this.elements.header) {
        this.elements.header.classList.remove("hide-header");
      }
    }, this.settings.touchEndDelay);
  }

  /**
   * Update scroll line for desktop
   */
  updateScrollLine(scrollData) {
    if (!this.elements.scrollLine) return;

    const thumbHeight =
      (scrollData.viewportHeight / scrollData.totalHeight) *
      scrollData.viewportHeight;
    const thumbPosition =
      (scrollData.scrollY * (scrollData.viewportHeight - thumbHeight)) /
      (scrollData.totalHeight - scrollData.viewportHeight);

    // Batch DOM updates
    this.elements.scrollLine.style.cssText = `
      --thumb-height: ${thumbHeight}px;
      --thumb-position: ${thumbPosition}px;
      opacity: ${this.calculateScrollLineOpacity(scrollData, thumbHeight)};
    `;
  }

  /**
   * Calculate scroll line opacity
   */
  calculateScrollLineOpacity(scrollData, thumbHeight) {
    const thumbFactor = thumbHeight / scrollData.viewportHeight;
    const curve = 1 + thumbFactor * 2;
    const scrollProgress =
      scrollData.scrollY / (scrollData.totalHeight - scrollData.viewportHeight);
    return Math.min(0.4, Math.pow(scrollProgress, 1 / curve) * 0.4);
  }

  /**
   * Update carousel parallax effect
   */
  updateCarouselParallax() {
    const track = this.elements.carouselTrack;
    if (!track) return;

    const cards = track.querySelectorAll(".carousel-card");
    const trackRect = track.getBoundingClientRect();
    const trackCenter = trackRect.left + trackRect.width / 2;

    // Process all cards in single operation
    cards.forEach((card) => {
      const cardRect = card.getBoundingClientRect();
      const cardCenter = cardRect.left + cardRect.width / 2;
      const distance = Math.abs(cardCenter - trackCenter);
      const maxDistance = trackRect.width / 2;

      let parallaxAmount = 0;
      if (distance < maxDistance * 0.9) {
        const normalizedDistance = distance / (maxDistance * 0.9);
        parallaxAmount = normalizedDistance * 16;
      }

      // Batch transform updates
      const image = card.querySelector(".carousel-card-image");
      const content = card.querySelector(".carousel-card-content");

      if (image && content) {
        image.style.transform = `translateX(${parallaxAmount * 0.8}px)`;
        content.style.transform = `translateY(${parallaxAmount * 0.5}px)`;
      }
    });
  }

  /**
   * Handle modal auto-close on scroll
   */
  handleModalAutoClose() {
    // Import modal functions if available
    if (window.hideModal) {
      window.hideModal();
    }
  }

  /**
   * Initialize scroll line element
   */
  initScrollLine() {
    if (this.elements.scrollLine) {
      this.elements.scrollLine.remove();
    }

    this.elements.scrollLine = document.createElement("div");
    this.elements.scrollLine.className = "scroll-line";
    document.body.appendChild(this.elements.scrollLine);
  }

  /**
   * Enable/disable specific features
   */
  toggleFeature(featureName, enabled) {
    if (this.features.hasOwnProperty(featureName)) {
      this.features[featureName] = enabled;
    }
  }

  /**
   * Update settings
   */
  updateSettings(newSettings) {
    Object.assign(this.settings, newSettings);
  }

  /**
   * Cleanup all scroll listeners and timeouts
   */
  cleanup() {
    // Remove scroll listener from all possible targets
    if (this.boundHandleScroll) {
      window.removeEventListener("scroll", this.boundHandleScroll);
      if (this.elements.categoryView) {
        this.elements.categoryView.removeEventListener(
          "scroll",
          this.boundHandleScroll
        );
      }
    }

    // Clear all timeouts
    clearTimeout(this.state.scrollTimeout);
    clearTimeout(this.state.touchTimeout);

    // Remove will-change properties
    if (this.elements.header) {
      this.elements.header.style.willChange = "auto";
    }

    // Remove scroll line
    if (this.elements.scrollLine) {
      this.elements.scrollLine.remove();
      this.elements.scrollLine = null;
    }
  }

  /**
   * Refresh manager when page content changes
   */
  refresh() {
    this.cleanup();
    this.initialize();
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    return {
      activeTarget: this.activeTarget === window ? "window" : "category-view",
      enabledFeatures: Object.entries(this.features)
        .filter(([, enabled]) => enabled)
        .map(([feature]) => feature),
      scrollPosition: this.state.lastScrollY,
      isScrolling: this.state.isScrolling,
    };
  }
}

// Create and export singleton instance
const scrollManager = new ScrollManager();

// Export functions for external use
export function refreshScrollManager() {
  scrollManager.refresh();
}

export function toggleScrollFeature(feature, enabled) {
  scrollManager.toggleFeature(feature, enabled);
}

export function updateScrollSettings(settings) {
  scrollManager.updateSettings(settings);
}

export function getScrollMetrics() {
  return scrollManager.getMetrics();
}

// Auto-cleanup on page unload
window.addEventListener("beforeunload", () => {
  scrollManager.cleanup();
});

// Export default instance
export default scrollManager;
