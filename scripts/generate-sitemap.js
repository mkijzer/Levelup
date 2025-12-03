// ============================================================================
// scripts/generate-sitemap.js - AUTOMATED SITEMAP GENERATOR
// ============================================================================
// Description: Generates simple sitemap.xml for SPA (Single Page Application)
// Only includes homepage to avoid Google Search Console hash URL errors
// ============================================================================

const fs = require("fs");
const path = require("path");

// Read articleLoader.js to extract launch date and articles per day
function extractConfigFromArticleLoader() {
  const articleLoaderPath = path.join(__dirname, "../js/articleLoader.js");
  const articleLoaderContent = fs.readFileSync(articleLoaderPath, "utf8");

  // Extract launch date - matches: LAUNCH_DATE: new Date("2025-10-10"),
  const launchDateMatch = articleLoaderContent.match(
    /LAUNCH_DATE:\s*new\s+Date\("([^"]+)"\)/
  );
  if (!launchDateMatch) {
    throw new Error("Could not find LAUNCH_DATE in articleLoader.js");
  }

  // Extract articles per week (your file uses ARTICLES_PER_WEEK)
  const articlesPerWeekMatch = articleLoaderContent.match(
    /ARTICLES_PER_WEEK:\s*(\d+)/
  );
  if (!articlesPerWeekMatch) {
    throw new Error("Could not find ARTICLES_PER_WEEK in articleLoader.js");
  }

  return {
    launchDate: new Date(launchDateMatch[1]),
    articlesPerWeek: parseInt(articlesPerWeekMatch[1]),
  };
}

// Calculate which articles should be published based on articleLoader logic
function getPublishedArticles(articles, config) {
  const today = new Date();
  const launchDate = new Date(config.launchDate);

  // Publishing days: Monday (1), Wednesday (3), Friday (5)
  const publishDays = [1, 3, 5];

  // Count how many publish days have passed since launch
  let publishedCount = 0;
  let currentDate = new Date(launchDate);

  while (currentDate <= today) {
    const dayOfWeek = currentDate.getDay();
    if (publishDays.includes(dayOfWeek)) {
      publishedCount++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Only include articles that should be published by now
  return articles.slice(0, Math.max(0, publishedCount));
}

// Generate simple sitemap XML (homepage only for SPA)
function generateSitemap(
  publishedArticles,
  domain = "https://levelupordiertrying.com"
) {
  const today = new Date().toISOString().split("T")[0];

  // Simple sitemap - only homepage for SPA
  // Google will crawl the homepage and discover all content through JavaScript
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${domain}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;

  return sitemap;
}

// Main function
async function main() {
  try {
    console.log("🔧 Generating simple sitemap for SPA...");

    // Read articles.json
    const articlesPath = path.join(__dirname, "../data/articles.json");
    const articles = JSON.parse(fs.readFileSync(articlesPath, "utf8"));
    console.log(`📖 Found ${articles.length} total articles`);

    // Extract config from articleLoader.js
    const config = extractConfigFromArticleLoader();
    console.log(`📅 Launch date: ${config.launchDate.toDateString()}`);
    console.log(`📊 Articles per week: ${config.articlesPerWeek}`);

    // Get published articles using same logic as articleLoader
    const publishedArticles = getPublishedArticles(articles, config);
    console.log(`✅ ${publishedArticles.length} articles are published`);

    // Generate simple sitemap (homepage only)
    const sitemap = generateSitemap(publishedArticles);

    // Write sitemap.xml
    const sitemapPath = path.join(__dirname, "../sitemap.xml");
    fs.writeFileSync(sitemapPath, sitemap);

    console.log(`🎉 Simple sitemap generated successfully!`);
    console.log(`📍 Location: ${sitemapPath}`);
    console.log(`📝 Contains: Homepage only (SPA-friendly)`);
    console.log(
      `🔍 Google will crawl homepage and discover ${publishedArticles.length} articles through JavaScript`
    );
  } catch (error) {
    console.error("❌ Error generating sitemap:", error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main };
