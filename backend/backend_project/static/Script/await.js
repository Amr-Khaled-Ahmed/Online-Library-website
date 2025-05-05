// Inject Font Awesome for icons
const faLink = document.createElement("link");
faLink.rel = "stylesheet";
faLink.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css";
document.head.appendChild(faLink);

// Create book download overlay
function createDownloadOverlay() {
  const overlay = document.createElement("div");
  overlay.id = "book-download-overlay";

  // Create book-shaped container with a unique class name to avoid conflicts
  const bookContainer = document.createElement("div");
  bookContainer.className = "loader-book-container";

  // Book spine
  const bookSpine = document.createElement("div");
  bookSpine.className = "book-spine";

  // Book cover
  const bookCover = document.createElement("div");
  bookCover.className = "book-cover";

  // Book pages animation
  const bookPages = document.createElement("div");
  bookPages.className = "book-pages";

  // Download icon inside book
  const icon = document.createElement("i");
  icon.className = "fas fa-file-pdf download-icon";

  // Progress elements
  const progressContainer = document.createElement("div");
  progressContainer.className = "progress-container";

  const progressBar = document.createElement("div");
  progressBar.className = "progress-bar";

  const progressFill = document.createElement("div");
  progressFill.className = "progress-fill";
  progressBar.appendChild(progressFill);

  const progressText = document.createElement("div");
  progressText.className = "progress-text";
  progressText.textContent = "0%";

  progressContainer.appendChild(progressBar);
  progressContainer.appendChild(progressText);

  // Loading text
  const text = document.createElement("div");
  text.className = "download-text";
  text.innerHTML = '<span class="text-highlight">Preparing</span> Web page for reading...';

  // Assemble book
  bookCover.appendChild(bookPages);
  bookCover.appendChild(icon);
  bookContainer.appendChild(bookSpine);
  bookContainer.appendChild(bookCover);

  // Assemble overlay
  overlay.appendChild(bookContainer);
  overlay.appendChild(progressContainer);
  overlay.appendChild(text);

  document.body.insertBefore(overlay, document.body.firstChild);
  document.body.classList.add("book-download-loading");

  // Progress animation
  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 8 + 2;
    progress = Math.min(progress, 100);
    progressFill.style.width = `${progress}%`;
    progressText.textContent = `${Math.round(progress)}%`;

    // Clear interval when progress is complete
    if (progress >= 100) {
      clearInterval(interval);
    }
  }, 150);

  return interval; // Return interval ID for cleanup
}

// Remove overlay after completion
function initLoader() {
  const progressInterval = createDownloadOverlay();

  setTimeout(() => {
    clearInterval(progressInterval); // Ensure interval is cleared
    const overlay = document.getElementById("book-download-overlay");
    if (overlay) {
      overlay.style.opacity = "0";
      setTimeout(() => {
        overlay.remove();
        document.body.classList.remove("book-download-loading");
      }, 500);
    }
  }, 3500);
}

// Inject necessary styles
function injectStyles() {
  const style = document.createElement("style");
  style.textContent = `
    /* Dark themed book download overlay */
    #book-download-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: #121212;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        transition: opacity 0.5s ease;
        color: #e0e0e0;
        font-family: 'Segoe UI', sans-serif;
    }

    /* Book styling - renamed to avoid conflicts */
    .loader-book-container {
        position: relative;
        width: 180px;
        height: 220px;
        perspective: 1000px;
        margin-bottom: 30px;
    }

    .book-cover {
        position: absolute;
        width: 100%;
        height: 100%;
        background: #1e3a8a;
        border-radius: 5px 15px 15px 5px;
        box-shadow: 5px 5px 15px rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        transform-style: preserve-3d;
        transform: rotateY(-10deg);
        transition: all 0.5s ease;
    }

    .book-spine {
        position: absolute;
        left: -10px;
        width: 20px;
        height: 100%;
        background: #0f2c6e;
        border-radius: 5px 0 0 5px;
        transform: rotateY(20deg);
        transform-origin: right center;
    }

    .book-pages {
        position: absolute;
        right: -5px;
        width: 10px;
        height: 96%;
        background: repeating-linear-gradient(
            #f8f9fa,
            #f8f9fa 5px,
            #e9ecef 5px,
            #e9ecef 10px
        );
        border-radius: 0 3px 3px 0;
    }

    .download-icon {
        font-size: 3.5rem;
        color: #f8f9fa;
        animation: pulse 1.5s infinite;
        text-shadow: 0 2px 5px rgba(0,0,0,0.3);
    }

    /* Progress bar */
    .progress-container {
        width: 80%;
        max-width: 400px;
        margin: 20px 0;
        text-align: center;
    }

    .progress-bar {
        width: 100%;
        height: 8px;
        background: #333;
        border-radius: 4px;
        margin-bottom: 8px;
        overflow: hidden;
    }

    .progress-fill {
        height: 100%;
        width: 0;
        background: linear-gradient(90deg, #2563eb, #3b82f6);
        border-radius: 4px;
        transition: width 0.3s ease;
        box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
    }

    .progress-text {
        font-size: 0.9rem;
        color: #a1a1aa;
    }

    /* Text styling */
    .download-text {
        font-size: 1.2rem;
        margin-top: 10px;
        text-align: center;
        color: #e5e7eb;
    }

    .text-highlight {
        color: #3b82f6;
        font-weight: 600;
    }

    /* Animations */
    @keyframes pulse {
        0% { transform: scale(1); opacity: 0.9; }
        50% { transform: scale(1.05); opacity: 1; }
        100% { transform: scale(1); opacity: 0.9; }
    }

    /* Body states */
    body.book-download-loading {
        overflow: hidden;
    }

    body.book-download-loading > *:not(#book-download-overlay) {
        opacity: 0;
        pointer-events: none;
    }
  `;
  document.head.appendChild(style);
}

// Initialize
injectStyles();
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initLoader);
} else {
  initLoader();
}
