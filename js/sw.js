const CACHE_NAME = "levelup-v1";
const STATIC_ASSETS = [
  "/",
  "css/reset.css",
  "css/variables.css",
  "css/base.css",
  "css/layout.css",
  "css/components.css",
  "css/utils.css",
  "css/themes.css",
  "js/svg.js",
  "js/modal.js",
  "js/data.js",
  "js/theme.js",
  "js/search.js",
  "js/quotes.js",
  "js/utils.js",
  "js/articleCards.js",
  "js/settings.js",
  "articles.json",
  "quotes.json",
  "assets/images/logo.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches
      .match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
