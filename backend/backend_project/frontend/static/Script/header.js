document.addEventListener("DOMContentLoaded", function () {
  const menuToggle = document.querySelector(".menu-toggle");
  const mobileMenu = document.querySelector(".mobile-menu");
  const header = document.querySelector("header");

  // Toggle mobile menu
  const toggleMenu = () => {
    mobileMenu.classList.toggle("active");
    document.body.style.overflow = mobileMenu.classList.contains("active")
      ? "hidden"
      : "";
  };

  // Close menu when clicking links
  const mobileNavLinks = document.querySelectorAll(".mobile-nav a");
  mobileNavLinks.forEach((link) => link.addEventListener("click", toggleMenu));

  // Toggle button click
  menuToggle?.addEventListener("click", toggleMenu);

  // Close menu on clicking outside
  document.addEventListener("click", function (e) {
    const isClickInsideMenu = mobileMenu.contains(e.target);
    const isClickOnToggle = menuToggle.contains(e.target);

    if (
      !isClickInsideMenu &&
      !isClickOnToggle &&
      mobileMenu.classList.contains("active")
    ) {
      toggleMenu();
    }
  });

  // Close menu on window resize (when hitting desktop breakpoint)
  window.addEventListener("resize", function () {
    if (window.innerWidth > 900 && mobileMenu.classList.contains("active")) {
      toggleMenu();
    }
  });

  // Scroll effect for header
  window.addEventListener("scroll", function () {
    header.classList.toggle("scrolled", window.scrollY > 10);
  });
});
