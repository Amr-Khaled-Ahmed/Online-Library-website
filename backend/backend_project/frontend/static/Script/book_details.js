document.addEventListener('DOMContentLoaded', async function () {

    if (!document.getElementById('custom-notification-styles')) {
        const notificationStyles = document.createElement('style');
        notificationStyles.id = 'custom-notification-styles';
        notificationStyles.textContent = `
            .custom-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background-color: #333;
                color: white;
                padding: 15px 25px;
                border-radius: 5px;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
                z-index: 9999;
                animation: slide-in 0.5s forwards, fade-out 0.5s 2.5s forwards;
            }

            @keyframes slide-in {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }

            @keyframes fade-out {
                from { opacity: 1; }
                to { opacity: 0; }
            }
        `;
        document.head.appendChild(notificationStyles);
    }

    const urlParams = new URLSearchParams(window.location.search);
    const bookId = urlParams.get('id');

    try {
        // Fetch book details from backend
        const response = await fetch(`/api/books/${bookId}/`);
        if (!response.ok) {
            throw new Error('Book not found');
        }
        const book = await response.json();

        // Display book info
        document.querySelector('.book-title').textContent = book.title || "No title";
        document.querySelector('.book-author').textContent = `By ${book.author || "Unknown"}`;
        document.querySelector('.book-cover img').src = book.cover_path;
        document.querySelector('.book-description').textContent = book.description || "No description.";
        document.querySelector('.book-status').textContent = book.is_available ? "Available" : "Borrowed";
        document.querySelector('.book-genre').textContent = book.genre || "Unknown";
        document.querySelector('.book-year').textContent = book.publication_year || "Unknown";

        const borrowBtn = document.querySelector(".btn");
        if (borrowBtn) {
            borrowBtn.addEventListener("click", async (e) => {
                e.preventDefault();
                const form = e.target.closest('form');
                if (!form) return;

                try {
                    const response = await fetch(form.action, {
                        method: 'POST',
                        headers: {
                            'X-CSRFToken': getCookie('csrftoken')
                        }
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.error || 'Failed to borrow book');
                    }

                    showNotification("✅ Book borrowed successfully!");

                    // Refresh the page after a short delay
                    setTimeout(() => {
                        window.location.reload();
                    }, 1500);

                } catch (error) {
                    showNotification(error.message || "❌ An error occurred while borrowing the book");
                    console.error('Error:', error);
                }
            });
        }

    } catch (error) {
        showNotification("❌ Book not found.");
        console.error('Error:', error);
    }

});

function showNotification(message) {
    const notif = document.createElement('div');
    notif.className = 'custom-notification';
    notif.textContent = message;
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 3000);
}

// Helper function to get CSRF token
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
