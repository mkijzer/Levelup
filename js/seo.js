// SEO meta tag management
export const SEO = {
  // Update page meta tags dynamically
  updateMeta(data) {
    const {
      title = "LevelUpOrDieTrying - Master Health, Wealth & Tech to Win in Life",
      description = "Master Health, Wealth & Tech to Win! Game-changing insights to Level Up your Life.",
      image = "assets/images/logo.png",
      url = window.location.href,
      type = "article",
    } = data;

    // Update document title
    document.title = title;

    // Update meta description
    this.updateMetaTag("name", "description", description);

    // Update Open Graph tags
    this.updateMetaTag("property", "og:title", title);
    this.updateMetaTag("property", "og:description", description);
    this.updateMetaTag("property", "og:image", image);
    this.updateMetaTag("property", "og:url", url);
    this.updateMetaTag("property", "og:type", type);

    // Update Twitter Card tags
    this.updateMetaTag("name", "twitter:title", title);
    this.updateMetaTag("name", "twitter:description", description);
    this.updateMetaTag("name", "twitter:image", image);
  },

  // Helper function to update or create meta tags
  updateMetaTag(attribute, name, content) {
    let element = document.querySelector(`meta[${attribute}="${name}"]`);

    if (element) {
      element.setAttribute("content", content);
    } else {
      element = document.createElement("meta");
      element.setAttribute(attribute, name);
      element.setAttribute("content", content);
      document.head.appendChild(element);
    }
  },

  // Reset to default meta tags
  resetToDefault() {
    this.updateMeta({});
  },
};
