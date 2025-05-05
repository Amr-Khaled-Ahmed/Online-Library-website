// Function to set the theme
function setTheme(theme) {
    if (theme === 'system') {
        document.documentElement.removeAttribute('data-theme');
        localStorage.removeItem('theme');
    } else {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }
}

// Function to initialize the theme
function initializeTheme() {
    // Check for saved theme preference or use system preference
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Set initial theme
    if (savedTheme) {
        setTheme(savedTheme);
    } else if (!systemPrefersDark) {
        setTheme('light');
    }
    
    // If we're on the profile page, set the select value
    const themeSelect = document.getElementById('theme');
    if (themeSelect) {
        themeSelect.value = savedTheme || (systemPrefersDark ? 'system' : 'light');
        
        // Handle theme change
        themeSelect.addEventListener('change', function() {
            setTheme(this.value);
        });
    }
}

// Initialize theme when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeTheme);

// Also initialize theme immediately in case DOM is already loaded
if (document.readyState !== 'loading') {
    initializeTheme();
} else {
    document.addEventListener('DOMContentLoaded', initializeTheme);
}