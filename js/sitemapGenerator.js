// ============================================================================
// sitemapGenerator.js - AUTOMATIC SITEMAP GENERATION
// ============================================================================
// Description: Generates sitemap.xml from articles.json data
// Version: 2.0 - Auto-generation on articles load
// ============================================================================

import { articlesData } from "./articleLoader.js";

// Auto-generate sitemap when articles are loaded
let lastArticleCount = 0;

/**
 * Auto-generates sitemap when article count changes
 */
export function checkAndGenerateSitemap() {
  if (articlesData.length !== lastArticleCount) {
    lastArticleCount = articlesData.length;
    autoGenerateSitemap();
  }
}

/**
 * Automatically generates and saves sitemap file
 */
async function autoGenerateSitemap() {
  try {
    const sitemapContent = generateSitemapXML();

    // In a local development environment, this would save the file
    // For production, this creates the content ready for manual upload
    if (
      typeof window !== "undefined" &&
      window.location.hostname === "localhost"
    ) {
      // Development - create download
      downloadSitemapFile(sitemapContent);
    }

    console.log("✅ Sitemap auto-generated");
    console.log("📁 Ready to upload with articles.json");
  } catch (error) {
    console.error("❌ Sitemap generation failed:", error);
  }
}

/**
 * Downloads sitemap file automatically
 */
function downloadSitemapFile(content) {
  const blob = new Blob([content], { type: "application/xml" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "sitemap.xml";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates sitemap XML content
 */
function generateSitemapXML() {
  const baseUrl = "https://levelupordietrying.com";
  const now = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format

  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Homepage - Google will crawl and find all content through SPA -->
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;

  return sitemap;
}

/**
 * Downloads sitemap as XML file
 */
export function downloadSitemap() {
  const sitemapContent = generateSitemapXML();
  const blob = new Blob([sitemapContent], { type: "application/xml" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "sitemap.xml";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Console output for manual copy-paste
 */
export function logSitemap() {
  const sitemapContent = generateSitemapXML();
  console.log("=== SITEMAP.XML CONTENT ===");
  console.log(sitemapContent);
  console.log("=== COPY ABOVE CONTENT TO sitemap.xml ===");
}

/**
 * Get sitemap content as string
 */
export function getSitemapContent() {
  return generateSitemapXML();
}
