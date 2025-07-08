// ============================================================================
// quotes.js - CLEANED VERSION
// ============================================================================
// Description: Quote management with better error handling and caching
// Version: 2.0 - Improved reliability and performance
// ============================================================================

// ============================================================================
// Configuration
// ============================================================================
const QUOTES_URL = "data/quotes.json";
const FALLBACK_QUOTE = {
  text: "Success is the sum of small efforts, repeated day in and day out.",
  author: "Robert Collier",
};

// ============================================================================
// Quote Manager Class
// ============================================================================
class QuoteManager {
  constructor() {
    this.quotes = [];
    this.elements = {};
    this.isLoaded = false;
    this.init();
  }

  async init() {
    this.elements = this.getElements();

    if (!this.validateElements()) {
      console.warn("Quotes: Required elements not found");
      return;
    }

    try {
      await this.loadQuotes();
      this.populateQuotes();
      console.log("Quotes: Initialized successfully");
    } catch (error) {
      console.error("Quotes: Initialization failed:", error);
      this.handleError();
    }
  }

  getElements() {
    return {
      separatorQuote: document.querySelector(".separator-quote"),
      separatorQuoteText: document.querySelector(
        ".separator-quote .quote-text"
      ),
      separatorQuoteAuthor: document.querySelector(
        ".separator-quote .quote-author"
      ),
      bottomQuoteText: document.querySelector("#quote-text"),
      bottomQuoteAuthor: document.querySelector("#quote-author"),
    };
  }

  validateElements() {
    const {
      separatorQuoteText,
      separatorQuoteAuthor,
      bottomQuoteText,
      bottomQuoteAuthor,
    } = this.elements;
    return (
      separatorQuoteText &&
      separatorQuoteAuthor &&
      bottomQuoteText &&
      bottomQuoteAuthor
    );
  }

  async loadQuotes() {
    try {
      const response = await fetch(QUOTES_URL);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!Array.isArray(data) || data.length === 0) {
        throw new Error("No quotes found in data file");
      }

      this.quotes = data;
      this.isLoaded = true;

      console.log(`Quotes: Loaded ${this.quotes.length} quotes`);
    } catch (error) {
      console.error("Quotes: Error loading quotes:", error);
      throw error;
    }
  }

  populateQuotes() {
    if (!this.isLoaded || this.quotes.length === 0) {
      this.handleError();
      return;
    }

    try {
      // Get two different random quotes
      const [quote1, quote2] = this.getTwoRandomQuotes();

      // Populate separator quote
      this.setQuote(
        this.elements.separatorQuoteText,
        this.elements.separatorQuoteAuthor,
        quote1
      );

      // Populate bottom quote
      this.setQuote(
        this.elements.bottomQuoteText,
        this.elements.bottomQuoteAuthor,
        quote2
      );
    } catch (error) {
      console.error("Quotes: Error populating quotes:", error);
      this.handleError();
    }
  }

  getTwoRandomQuotes() {
    if (this.quotes.length === 1) {
      return [this.quotes[0], this.quotes[0]];
    }

    const firstIndex = Math.floor(Math.random() * this.quotes.length);
    let secondIndex;

    do {
      secondIndex = Math.floor(Math.random() * this.quotes.length);
    } while (secondIndex === firstIndex && this.quotes.length > 1);

    return [this.quotes[firstIndex], this.quotes[secondIndex]];
  }

  setQuote(textElement, authorElement, quote) {
    if (textElement && authorElement && quote) {
      textElement.textContent = `"${quote.text}"`;
      authorElement.textContent = `- ${quote.author}`;
    }
  }

  handleError() {
    console.warn("Quotes: Using fallback quotes due to error");

    // Use fallback quote for both locations
    this.setQuote(
      this.elements.separatorQuoteText,
      this.elements.separatorQuoteAuthor,
      FALLBACK_QUOTE
    );

    this.setQuote(
      this.elements.bottomQuoteText,
      this.elements.bottomQuoteAuthor,
      FALLBACK_QUOTE
    );
  }

  // Public API for refreshing quotes
  async refreshQuotes() {
    try {
      await this.loadQuotes();
      this.populateQuotes();
      console.log("Quotes: Refreshed successfully");
    } catch (error) {
      console.error("Quotes: Error refreshing quotes:", error);
      this.handleError();
    }
  }

  // Get random quote for external use
  getRandomQuote() {
    if (this.quotes.length === 0) {
      return FALLBACK_QUOTE;
    }

    const randomIndex = Math.floor(Math.random() * this.quotes.length);
    return this.quotes[randomIndex];
  }
}

// ============================================================================
// Initialization
// ============================================================================
let quoteManager = null;

async function initializeQuotes() {
  if (!quoteManager) {
    quoteManager = new QuoteManager();
  }
  return quoteManager;
}

// Auto-initialize when DOM is ready
document.addEventListener("DOMContentLoaded", initializeQuotes);

// Export for external use
export { initializeQuotes, QuoteManager };
