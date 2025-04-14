// Mobile Menu Toggle
const menuToggle = document.querySelector(".menu-toggle");
const mobileMenu = document.querySelector(".mobile-menu");
const overlay = document.querySelector(".overlay");
const closeMenu = document.querySelector(".close-menu");

// Toggle mobile menu function
function toggleMenu() {
  if (mobileMenu.classList.contains("active")) {
    closeMenuFunc();
  } else {
    mobileMenu.classList.add("active");
    overlay.classList.add("active");
    document.body.style.overflow = "hidden";
  }
}

// Close mobile menu function
function closeMenuFunc() {
  mobileMenu.classList.remove("active");
  overlay.classList.remove("active");
  document.body.style.overflow = "";
}

// Event listeners
menuToggle.addEventListener("click", toggleMenu);
closeMenu.addEventListener("click", closeMenuFunc);
overlay.addEventListener("click", closeMenuFunc);

// Close menu when clicking links
const mobileNavLinks = document.querySelectorAll(".mobile-nav a");
mobileNavLinks.forEach((link) => {
  link.addEventListener("click", closeMenuFunc);
});

// Scroll detection for header background
window.addEventListener("scroll", function () {
  const header = document.querySelector("header");
  header.classList.toggle("scrolled", window.scrollY > 50);
});

// Active menu item detection
function setActiveMenuItem() {
  const sections = document.querySelectorAll("section[id]");
  const scrollPosition = window.scrollY + 100;

  sections.forEach((section) => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.offsetHeight;
    const sectionId = section.getAttribute("id");

    if (
      scrollPosition >= sectionTop &&
      scrollPosition < sectionTop + sectionHeight
    ) {
      document.querySelectorAll(".nav-bar a, .mobile-nav a").forEach((link) => {
        link.classList.toggle(
          "active",
          link.getAttribute("href") === `#${sectionId}`
        );
      });
    }
  });
}

window.addEventListener("scroll", setActiveMenuItem);
// Run once on page load
setActiveMenuItem();
