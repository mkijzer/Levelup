const fs = require("fs");

// Load and parse your JSON file
let data = fs.readFileSync("articles.json", "utf8");
let articles = JSON.parse(data);

// Loop through and modify each article
articles = articles.map((article) => {
  if (!article["inline image"]) {
    const newArticle = {};
    for (const key in article) {
      newArticle[key] = article[key];
      // Insert "inline image" right after the "image" key
      if (key === "image") {
        newArticle["inline image"] = "assets/images/falback_image.png";
      }
    }
    return newArticle;
  }
  return article;
});

// Save the updated JSON back to file
fs.writeFileSync("articles.json", JSON.stringify(articles, null, 2));
console.log("✅ Done: inline image added where missing.");
