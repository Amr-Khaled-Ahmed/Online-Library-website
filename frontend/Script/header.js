document.addEventListener("DOMContentLoaded", function () {
  const menuToggle = document.querySelector(".menu-toggle");
  const mobileMenu = document.querySelector(".mobile-menu");
  const overlay = document.querySelector(".overlay");
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

  // Event listeners
  menuToggle?.addEventListener("click", toggleMenu);
  overlay?.addEventListener("click", toggleMenu);

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
