#!/usr/bin/env node

// Article Export Script for Numbers
// Run: node export-articles.js

const fs = require("fs");
const path = require("path");

function escapeCsv(text) {
  if (!text) return "";
  text = String(text);
  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return '"' + text.replace(/"/g, '""') + '"';
  }
  return text;
}

function calculatePublishDates(articles) {
  // Use the same launch date as your website
  const launchDate = new Date("2025-10-25");

  // Make sure it's a Monday
  while (launchDate.getDay() !== 1) {
    launchDate.setDate(launchDate.getDate() + 1);
  }

  articles.forEach((article, index) => {
    const weeksFromLaunch = Math.floor(index / 3);
    const positionInWeek = index % 3;

    const publishDate = new Date(launchDate);
    publishDate.setDate(
      launchDate.getDate() + weeksFromLaunch * 7 + positionInWeek * 2
    );

    article.calculatedDate = publishDate.toISOString().split("T")[0];

    // Calculate status - only first 23 articles are published
    article.calculatedStatus = index < 23 ? "Published" : "Draft";
  });

  return articles;
}

function exportArticlesToCsv() {
  try {
    // Read articles.json from data directory
    const articlesPath = path.join(__dirname, "data", "articles.json");
    if (!fs.existsSync(articlesPath)) {
      console.error(
        "❌ data/articles.json not found. Make sure script is in project root."
      );
      process.exit(1);
    }

    let articles = JSON.parse(fs.readFileSync(articlesPath, "utf8"));
    articles = calculatePublishDates(articles);
    const headers = [
      "ID",
      "Title",
      "Category",
      "Author",
      "Slug",
      "Publish_Date",
      "Status",
      "Word_Count",
      "Read_Time",
      "Tags",
      "Hook",
      "Content_Preview",
      "Image_Main",
      "Image_Inline",
      "Views_Total",
      "Views_This_Week",
      "Social_Shares_Total",
      "Instagram_Likes",
      "Instagram_Comments",
      "Instagram_Saves",
      "TikTok_Views",
      "TikTok_Likes",
      "LinkedIn_Views",
      "LinkedIn_Reactions",
      "Traffic_Source_Social",
      "Traffic_Source_Search",
      "Traffic_Source_Direct",
      "Time_On_Page_Avg",
      "Bounce_Rate",
      "What_Worked",
      "What_Didnt_Work",
      "Lessons_Learned",
      "Next_Iteration_Ideas",
      "Competitor_Response",
      "ROI_Rating_1_10",
      "Notes",
    ];

    let csvContent = headers.join(",") + "\n";

    articles.forEach((article) => {
      const wordCount = article.content
        ? article.content.replace(/<[^>]*>/g, "").split(" ").length
        : 0;
      const readTime = Math.ceil(wordCount / 200);
      const contentPreview = article.content
        ? article.content.replace(/<[^>]*>/g, "").substring(0, 80)
        : "";
      const tags = article.tags ? article.tags.join("; ") : "";

      const row = [
        article.id || "",
        escapeCsv(article.title || ""),
        article.category || "",
        article.author || "",
        article.slug || "",
        article.calculatedDate || "",
        article.calculatedStatus || "Draft",
        wordCount,
        readTime + " min",
        escapeCsv(tags),
        escapeCsv(article.hook || ""),
        escapeCsv(contentPreview),
        article.image || "",
        article.inline_image || "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
      ];

      csvContent += row.join(",") + "\n";
    });

    const outputPath = path.join(
      __dirname,
      "article_info_and_data_for_analysis_export.csv"
    );
    fs.writeFileSync(outputPath, csvContent);

    console.log("✅ Export complete!");
    console.log(`📁 File: ${outputPath}`);
    console.log(`📊 Articles: ${articles.length}`);
    console.log("\n📋 Next steps:");
    console.log("1. Open Numbers");
    console.log("2. Import articles-export.csv");
    console.log("3. Replace old data with new data");
  } catch (error) {
    console.error("❌ Export failed:", error.message);
    process.exit(1);
  }
}

// Run export
exportArticlesToCsv();
