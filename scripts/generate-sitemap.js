// ============================================================================
// scripts/generate-sitemap.js - AUTOMATED SITEMAP GENERATOR
// ============================================================================
// Description: Generates sitemap.xml using the same logic as articleLoader.js
// Reads launch date and articles per day from articleLoader to stay in sync
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
  const daysSinceLaunch = Math.floor(
    (today - config.launchDate) / (1000 * 60 * 60 * 24)
  );
  const maxPublishedIndex =
    daysSinceLaunch * config.articlesPerWeek + config.articlesPerWeek;

  // Only include articles that should be published by now
  return articles.slice(0, Math.max(0, maxPublishedIndex));
}

// Generate sitemap XML
function generateSitemap(publishedArticles, domain = "https://yourdomain.com") {
  const today = new Date().toISOString().split("T")[0];

  // Main page
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${domain}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`;

  // Add each published article
  publishedArticles.forEach((article) => {
    const articleUrl = article.slug ? `#${article.slug}` : `#${article.id}`;
    const lastmod = article.date || today;

    sitemap += `
  <url>
    <loc>${domain}/${articleUrl}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
  });

  sitemap += `
</urlset>`;

  return sitemap;
}

// Main function
async function main() {
  try {
    console.log("🔧 Generating sitemap...");

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

    // Generate sitemap
    const sitemap = generateSitemap(publishedArticles);

    // Write sitemap.xml
    const sitemapPath = path.join(__dirname, "../sitemap.xml");
    fs.writeFileSync(sitemapPath, sitemap);

    console.log(`🎉 Sitemap generated successfully!`);
    console.log(`📍 Location: ${sitemapPath}`);
    console.log(`🔗 Articles included: ${publishedArticles.length}`);
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
