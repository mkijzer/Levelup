// ============================================================================
// cookieConsent.js - COOKIE CONSENT MANAGEMENT
// ============================================================================
// Description: Handles cookie consent and Google Analytics loading
// Version: 1.1 - Added dynamic modal creation
// Author: Mike
// ============================================================================

const COOKIE_CONSENT_KEY = "levelup-cookie-consent";

/**
 * Create cookie consent modal HTML
 */
function createCookieModal() {
  const modalHTML = `
    <div id="cookie-consent" class="cookie-consent-modal" aria-hidden="true">
      <div class="cookie-content">
        <div class="cookie-header">
          <h2 class="cookie-title">🍪 We Use Cookies</h2>
        </div>
        <div class="cookie-body">
          <p class="cookie-text">
            We use cookies to improve your experience and analyze site usage. 
            By continuing, you agree to our use of cookies.
          </p>
        </div>
        <div class="cookie-actions">
          <button id="cookie-accept" class="cookie-btn cookie-accept">Accept</button>
          <button id="cookie-decline" class="cookie-btn cookie-decline">Decline</button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", modalHTML);
}

/**
 * Initialize cookie consent system
 */
export function initCookieConsent() {
  // Create the modal HTML first
  createCookieModal();

  // Check if user has already made a choice
  const existingConsent = getCookieConsent();

  if (existingConsent === null) {
    // Show consent modal after short delay
    setTimeout(() => {
      showCookieModal();
    }, 2000);
  } else if (existingConsent === "accepted") {
    // User previously accepted - load analytics
    loadGoogleAnalytics();
  }

  setupEventListeners();
}

/**
 * Show the cookie consent modal
 */
function showCookieModal() {
  const modal = document.getElementById("cookie-consent");
  if (modal) {
    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");
  }
}

/**
 * Hide the cookie consent modal
 */
function hideCookieModal() {
  const modal = document.getElementById("cookie-consent");
  if (modal) {
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
  }
}

/**
 * Setup event listeners for consent buttons
 */
function setupEventListeners() {
  const acceptBtn = document.getElementById("cookie-accept");
  const declineBtn = document.getElementById("cookie-decline");

  acceptBtn?.addEventListener("click", handleAccept);
  declineBtn?.addEventListener("click", handleDecline);
}

/**
 * Handle accept button click
 */
function handleAccept() {
  setCookieConsent("accepted");
  hideCookieModal();
  loadGoogleAnalytics();
  console.log("Cookies accepted - Analytics loaded");
}

/**
 * Handle decline button click
 */
function handleDecline() {
  setCookieConsent("declined");
  hideCookieModal();
  console.log("Cookies declined - No analytics loaded");
}

/**
 * Store cookie consent preference with different expiry times
 */
function setCookieConsent(value) {
  let expiryDays;

  if (value === "accepted") {
    expiryDays = 365; // Remember acceptance for 1 year
  } else if (value === "declined") {
    expiryDays = 7; // Remember decline for 7 days only
  }

  const expiry = new Date();
  expiry.setTime(expiry.getTime() + expiryDays * 24 * 60 * 60 * 1000);

  document.cookie = `${COOKIE_CONSENT_KEY}=${value}; expires=${expiry.toUTCString()}; path=/; SameSite=Strict`;

  console.log(`Cookie consent set to: ${value} for ${expiryDays} days`);
}

/**
 * Get stored cookie consent preference
 */
function getCookieConsent() {
  const name = COOKIE_CONSENT_KEY + "=";
  const decodedCookie = decodeURIComponent(document.cookie);
  const cookies = decodedCookie.split(";");

  for (let cookie of cookies) {
    while (cookie.charAt(0) === " ") {
      cookie = cookie.substring(1);
    }
    if (cookie.indexOf(name) === 0) {
      return cookie.substring(name.length, cookie.length);
    }
  }
  return null;
}

/**
 * Load Google Analytics after consent
 */
function loadGoogleAnalytics() {
  // Only load if not already loaded
  if (window.gtag) {
    console.log("Google Analytics already loaded");
    return;
  }

  // Create and load GA script
  const script = document.createElement("script");
  script.async = true;
  script.src = "https://www.googletagmanager.com/gtag/js?id=G-FBTQXJCLGX";
  document.head.appendChild(script);

  // Initialize gtag
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    dataLayer.push(arguments);
  }
  window.gtag = gtag;

  gtag("js", new Date());
  gtag("config", "G-FBTQXJCLGX");

  console.log("Google Analytics loaded and configured");

  // /**
  //  * Debug function - Force show cookie modal (for testing only)
  //  */
  // window.showCookieModalDebug = function () {
  //   // Remove existing modal if present
  //   const existingModal = document.getElementById("cookie-consent");
  //   if (existingModal) {
  //     existingModal.remove();
  //   }

  //   // Create new modal
  //   createCookieModal();
  //   setupEventListeners();

  //   // Show immediately
  //   setTimeout(() => {
  //     showCookieModal();
  //   }, 100);
  // };

  // // AUTO-SHOW FOR TESTING (remove this line when done)
  // setTimeout(() => window.showCookieModalDebug(), 1000);
}
