// Scroll to Top Button
const scrollTopBtn = document.querySelector('.scroll-top');

// Show/hide scroll-to-top button based on scroll position
window.addEventListener('scroll', () => {
  // Show button when user scrolls down 300px from the top
  if (window.pageYOffset > 300) {
    scrollTopBtn.classList.add('active');
  } else {
    scrollTopBtn.classList.remove('active');
  }
});

// Scroll to top when button is clicked
scrollTopBtn.addEventListener('click', (e) => {
  e.preventDefault();
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
});

// Current year for copyright
const yearElement = document.getElementById('current-year');
if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

// Newsletter form submission
const newsletterForm = document.querySelector('.newsletter-form');
if (newsletterForm) {
  newsletterForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const emailInput = newsletterForm.querySelector('input[type="email"]');

    if (emailInput.value) {
      // Here you would typically send the data to a server
      // For now, just show a confirmation message
      alert('Thank you for subscribing to our newsletter!');
      emailInput.value = '';
    }
  });
}
