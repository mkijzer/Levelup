document.addEventListener("DOMContentLoaded", () => {
  const themeSwitch = document.querySelector("#theme-switch");

  if (!themeSwitch) {
    console.error("Theme switch element not found");
    return;
  }

  // Load theme preference on page load
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "light") {
    document.body.classList.add("light-mode");
    themeSwitch.checked = true;
  }

  // Toggle theme when the checkbox is changed
  themeSwitch.addEventListener("change", () => {
    document.body.classList.toggle("light-mode");
    localStorage.setItem(
      "theme",
      document.body.classList.contains("light-mode") ? "light" : "dark"
    );
  });
});
