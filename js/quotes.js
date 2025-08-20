// ============================================================================
// quotes.js - QUOTE MANAGEMENT MODULE
// ============================================================================
// Description: Manages quote loading, display, and refreshing with error handling.
// Purpose: Populates two quote sections dynamically from a JSON file or fallback.
// Version: 2.2 - Fixed selector logic, improved robustness, updated comments.
// Author: Mike (with Grok assistance)
// Last Updated: August 19, 2025, 11:05 AM CEST
// ============================================================================

// ============================================================================
// Configuration Constants
// ============================================================================
// Define the URL for the quotes JSON file and a fallback quote for errors.
const QUOTES_URL = "data/quotes.json";
const FALLBACK_QUOTE = {
  text: "Success is the sum of small efforts, repeated day in and day out.",
  author: "Robert Collier",
};

// ============================================================================
// QuoteManager Class
// ============================================================================
// Manages quote data, DOM interactions, and error handling in a single instance.
class QuoteManager {
  constructor() {
    // Initialize storage for quotes and DOM elements
    this.quotes = [];
    this.elements = {};
    this.isLoaded = false;

    // Start the initialization process
    this.init();
  }

  // Initialize the quote manager by fetching elements and loading quotes
  async init() {
    // Retrieve and validate DOM elements
    this.elements = this.getElements();
    if (!this.validateElements()) {
      console.warn("Quotes: Required DOM elements not found, using fallback.");
      this.handleError(); // Proceed with fallback if elements are missing
      return;
    }

    try {
      // Load quotes and populate the page
      await this.loadQuotes();
      this.populateQuotes();
      console.log("Quotes: Successfully initialized with quote data.");
    } catch (error) {
      console.error("Quotes: Initialization failed:", error);
      this.handleError();
    }
  }

  // Retrieve DOM elements for quote display using querySelectorAll
  getElements() {
    const quoteElements = document.querySelectorAll(".quote");
    return {
      quote1Container: quoteElements[0],
      quote1Text: quoteElements[0]?.querySelector(".quote-text"),
      quote1Author: quoteElements[0]?.querySelector(".quote-author"),
      quote2Container: quoteElements[1],
      quote2Text: quoteElements[1]?.querySelector(".quote-text"),
      quote2Author: quoteElements[1]?.querySelector(".quote-author"),
    };
  }

  // Validate that all necessary DOM elements exist
  validateElements() {
    const { quote1Text, quote1Author, quote2Text, quote2Author } =
      this.elements;
    return quote1Text && quote1Author && quote2Text && quote2Author;
  }

  // Fetch quotes from the JSON file
  async loadQuotes() {
    try {
      const response = await fetch(QUOTES_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error("Invalid or empty quotes data.");
      }

      this.quotes = data;
      this.isLoaded = true;
      console.log(`Quotes: Loaded ${this.quotes.length} quotes successfully.`);
    } catch (error) {
      console.error("Quotes: Failed to load quotes:", error);
      throw error;
    }
  }

  // Populate both quote sections with random quotes
  populateQuotes() {
    if (!this.isLoaded || this.quotes.length === 0) {
      this.handleError();
      return;
    }

    try {
      // Select two unique random quotes
      const [quote1, quote2] = this.getTwoRandomQuotes();

      // Update the first quote section
      this.setQuote(
        this.elements.quote1Text,
        this.elements.quote1Author,
        quote1
      );

      // Update the second quote section
      this.setQuote(
        this.elements.quote2Text,
        this.elements.quote2Author,
        quote2
      );
    } catch (error) {
      console.error("Quotes: Error populating quotes:", error);
      this.handleError();
    }
  }

  // Get two different random quotes from the array
  getTwoRandomQuotes() {
    if (this.quotes.length <= 1) {
      return [
        this.quotes[0] || FALLBACK_QUOTE,
        this.quotes[0] || FALLBACK_QUOTE,
      ];
    }

    const firstIndex = Math.floor(Math.random() * this.quotes.length);
    let secondIndex;
    do {
      secondIndex = Math.floor(Math.random() * this.quotes.length);
    } while (secondIndex === firstIndex);

    return [this.quotes[firstIndex], this.quotes[secondIndex]];
  }

  // Set text and author for a given quote element pair
  setQuote(textElement, authorElement, quote) {
    if (textElement && authorElement && quote) {
      textElement.textContent = `"${quote.text}"`;
      authorElement.textContent = `- ${quote.author}`;
    }
  }

  // Handle errors by applying fallback quotes
  handleError() {
    console.warn("Quotes: Falling back to default quote due to error.");

    this.setQuote(
      this.elements.quote1Text,
      this.elements.quote1Author,
      FALLBACK_QUOTE
    );
    this.setQuote(
      this.elements.quote2Text,
      this.elements.quote2Author,
      FALLBACK_QUOTE
    );
  }

  // Public method to refresh quotes manually
  async refreshQuotes() {
    try {
      await this.loadQuotes();
      this.populateQuotes();
      console.log("Quotes: Refreshed successfully.");
    } catch (error) {
      console.error("Quotes: Error during refresh:", error);
      this.handleError();
    }
  }

  // Provide a random quote for external use
  getRandomQuote() {
    return this.quotes.length > 0
      ? this.quotes[Math.floor(Math.random() * this.quotes.length)]
      : FALLBACK_QUOTE;
  }
}

// ============================================================================
// Initialization Logic
// ============================================================================
// Ensure quotes are initialized when the DOM is ready.
let quoteManager = null;

async function initializeQuotes() {
  if (!quoteManager) {
    quoteManager = new QuoteManager();
  }
  return quoteManager;
}

document.addEventListener("DOMContentLoaded", initializeQuotes);

// Export for potential use in other modules
export { initializeQuotes, QuoteManager };
