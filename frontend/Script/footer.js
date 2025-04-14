document.addEventListener('DOMContentLoaded', function() {
  const scrollTopBtn = document.querySelector('.scroll-top');

  if (scrollTopBtn) {
      // Show/hide button on scroll
      window.addEventListener('scroll', () => {
          scrollTopBtn.classList.toggle('active', window.scrollY > 300);
      });

      // Smooth scroll to top
      scrollTopBtn.addEventListener('click', (e) => {
          e.preventDefault();
          window.scrollTo({
              top: 0,
              behavior: 'smooth'
          });
      });
  }
});
