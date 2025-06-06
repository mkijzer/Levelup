/* js/theme.js: Replace the entire file */
const themeSwitch = document.querySelector("#theme-switch");

// Apply saved theme immediately
const savedTheme = localStorage.getItem("theme") || "dark";
if (savedTheme === "light") {
  document.documentElement.classList.add("light-mode");
  if (themeSwitch) themeSwitch.checked = true;
} else {
  document.documentElement.classList.remove("light-mode");
}

// Add event listener for theme toggle
if (themeSwitch) {
  themeSwitch.addEventListener("change", () => {
    document.documentElement.classList.toggle("light-mode");
    const newTheme = document.documentElement.classList.contains("light-mode")
      ? "light"
      : "dark";
    localStorage.setItem("theme", newTheme);
  });
} else {
  console.error("Theme switch element not found");
}
