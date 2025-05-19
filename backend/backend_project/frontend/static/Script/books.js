// Remove localStorage related to user data at the top, as favorites are now handled by the backend.
// const loggedInUser = JSON.parse(localStorage.getItem('loggedIn_user'));
// const usersData = JSON.parse(localStorage.getItem('users_data')) || [];
// const userIndex = usersData.findIndex(u => u && u.username === loggedInUser?.username);

// Remove initializeUserData function as it's no longer needed for favorites/borrows state.
// function initializeUserData() { ... }
// const userData = initializeUserData();

// Remove sampleBooks as books are fetched from the backend.
// const sampleBooks = [...];

let currentUserFavorites = []; // Array to store IDs of books the current user has favorited

function addBookToDisplay(book) {
    const bookItem = document.createElement('div');
    bookItem.className = 'book-item';
    bookItem.id = `book_${book.book_id}`; // Use a more descriptive ID

    // Check if the current book is in the user's favorites
    const isFavorite = currentUserFavorites.includes(book.book_id);
    const starClass = isFavorite ? 'active' : '';

    // Determine if physical copies are available for borrowing
    const canBorrowPhysical = book.available_physical_copies > 0;

    // Determine the text for the physical borrow button
    const borrowButtonText = canBorrowPhysical ? 'Borrow' : 'Not Available';

    // Determine if the physical borrow button should be disabled
    const borrowButtonDisabled = !canBorrowPhysical ? 'disabled' : '';

    // Determine availability text and class for the badge
    let badgeText;
    let badgeClass;

    if (book.available_physical_copies > 0) {
        badgeText = 'Available'; // Or 'In Stock'
        badgeClass = 'available';
    } else { // physical copies are 0
        if (book.is_available) { // overall available due to digital copies
            badgeText = 'Unavailable'; // Indicate digital availability
            badgeClass = 'low-stock'; // Use low-stock class or define a new one if needed
        } else { // not available at all (no physical, no digital)
            badgeText = 'Unavailable';
            badgeClass = 'unavailable';
        }
    }


    bookItem.innerHTML = `
        <button class="star-button ${starClass}" data-book-id="${book.book_id}"><i class="fas fa-star"></i></button>
        <div class="book-cover">
            ${book.cover_image_url ?
                `<img src="${book.cover_image_url}" alt="${book.title} book cover">` :
                `<i class="fas fa-book-open"></i>` // Placeholder icon if no cover
            }
        </div>
        <div class="book-details">
            <h3 class="book-title">${book.title}</h3>
            <p class="book-author">By ${book.author_name}</p>
            <div class="book-meta">
                <span class="meta-item">${book.genre_name || 'Unknown'}</span>
                <span class="meta-item">${book.publication_year || 'Unknown'}</span>
            </div>
            <div class="availability">
                <span class="availability-badge ${badgeClass}">
                    ${badgeText}
                </span>
                ${book.available_physical_copies > 0 ? `<span class="copies-count">${book.available_physical_copies} copies</span>` : ''}
                ${book.ebook_available ? `<span class="format-indicator">eBook</span>` : ''}
                ${book.audiobook_available ? `<span class="format-indicator">Audiobook</span>` : ''}
            </div>
            <div class="book-actions">
                <a href="/book-details?id=${book.book_id}" class="book-btn details-btn">Details</a>
                <button class="book-btn borrow-btn" data-book-id="${book.book_id}" ${borrowButtonDisabled}>${borrowButtonText}</button>
            </div>
        </div>
    `;

    // Add borrow button event listener
    const borrowBtn = bookItem.querySelector('.borrow-btn');
    // Only add listener if the button is not disabled (i.e., physical copies are available for this button's action)
    if (!borrowBtn.disabled) {
        borrowBtn.addEventListener('click', async () => {
            const bookIdToBorrow = borrowBtn.getAttribute('data-book-id');
            if (!bookIdToBorrow) {
                console.error('Borrow button is missing data-book-id');
                showNotification("❌ Error: Could not borrow book.");
                return;
            }

            // Keep the button enabled until the API response is received
            // borrowBtn.disabled = true; // Removed as per request
            // borrowBtn.classList.add('disabled'); // Removed as per request
            // borrowBtn.textContent = 'Processing...'; // Removed as per request

            try {
                const response = await fetch(`/api/books/${bookIdToBorrow}/borrow/`, {
                    method: 'POST',
                    headers: {
                        'X-CSRFToken': getCookie('csrftoken')
                    }
                });

                const data = await response.json();

                if (!response.ok) {
                     // Re-enable the button and revert text on failure
                     // borrowBtn.disabled = false; // Not needed if not disabled initially
                     // borrowBtn.classList.remove('disabled'); // Not needed if not disabled initially
                     // borrowBtn.textContent = borrowButtonText; // Not needed if not changed initially

                    // Display specific error message from the backend
                    showNotification(`❌ ${data.error || 'Failed to borrow book'}`);
                    console.error('Error:', data.error);
                } else {
                    showNotification("✅ Book borrowed successfully!");

                    // Find the specific book item in the DOM
                    const bookItem = document.getElementById(`book_${bookIdToBorrow}`);
                    if (bookItem) {
                        // Find the copies count element
                        const copiesCountElement = bookItem.querySelector('.copies-count');
                        if (copiesCountElement) {
                            // If your backend returns the updated count, use it:
                            // const newAvailableCopies = data.new_available_copies; // Adjust based on your actual backend response
                            // copiesCountElement.textContent = `${newAvailableCopies} copies`;

                            // If your backend doesn't return the new count, decrement the current one
                            const currentCopiesText = copiesCountElement.textContent;
                            const currentCopies = parseInt(currentCopiesText.split(' ')[0]);
                            if (!isNaN(currentCopies) && currentCopies > 0) {
                                 const newCopies = currentCopies - 1;
                                 copiesCountElement.textContent = `${newCopies} copies`;

                                 // Update availability badge if copies reach 0
                                 if (newCopies === 0) {
                                     const availabilityBadge = bookItem.querySelector('.availability-badge');
                                     if (availabilityBadge) {
                                         availabilityBadge.textContent = 'Unavailable';
                                         availabilityBadge.classList.remove('available');
                                         availabilityBadge.classList.add('unavailable');
                                     }
                                      // Also update the borrow button text and disable it permanently
                                      borrowBtn.textContent = 'Not Available';
                                      borrowBtn.disabled = true; // Disable the button
                                      borrowBtn.classList.add('disabled'); // Add disabled class
                                 }
                            } else {
                                 // If parsing fails or current count is not positive, re-fetch to be safe
                                 setTimeout(() => {
                                     filterBooks(); // Re-fetch with current filters
                                 }, 500); // Delay by 500ms
                            }
                        }
                    }

                    // Keep the re-fetch as a fallback to ensure consistency
                     setTimeout(() => {
                         filterBooks(); // Re-fetch with current filters
                     }, 500); // Delay by 500ms
                }

            } catch (error) {
                 // Re-enable the button and revert text on fetch error (not strictly needed if not disabled initially, but good practice)
                 borrowBtn.disabled = false;
                 borrowBtn.classList.remove('disabled');
                 borrowBtn.textContent = borrowButtonText; // Revert to original text

                showNotification(`❌ An error occurred: ${error.message || 'Failed to borrow book'}`);
                console.error('Fetch Error:', error);
            }
        });
    }

    // Add star button event listener
    const starButton = bookItem.querySelector('.star-button');
    starButton.addEventListener('click', async () => {
        const bookIdToFavorite = starButton.getAttribute('data-book-id');
        if (!bookIdToFavorite) {
            console.error('Star button is missing data-book-id');
            showNotification("❌ Error: Could not favorite book.");
            return;
        }

        try {
            const response = await fetch(`/api/books/${bookIdToFavorite}/favorite/`, {
                method: 'POST', // Use POST for toggling favorite status
                headers: {
                    'X-CSRFToken': getCookie('csrftoken')
                }
            });

            const data = await response.json();

            if (!response.ok) {
                // Handle cases where user is not logged in for favoriting
                if (response.status === 401) {
                     showNotification("❌ You must be logged in to favorite books.");
                } else {
                     showNotification(`❌ ${data.error || 'Failed to update favorites'}`);
                     console.error('Error:', data.error);
                }
            } else {
                if (data.favorited) {
                    starButton.classList.add('active');
                    showNotification("⭐ Added to favorites!");
                    // Add to current user favorites list
                    if (!currentUserFavorites.includes(parseInt(bookIdToFavorite))) {
                         currentUserFavorites.push(parseInt(bookIdToFavorite));
                    }
                } else {
                    starButton.classList.remove('active');
                    showNotification("⭐ Removed from favorites!");
                    // Remove from current user favorites list
                    currentUserFavorites = currentUserFavorites.filter(id => id !== parseInt(bookIdToFavorite));
                }
            }
        } catch (error) {
            showNotification(`❌ An error occurred: ${error.message || 'Failed to update favorites'}`);
            console.error('Fetch Error:', error);
        }
    });

    return bookItem;
}

async function handleNotification(message, category = 'New book alert') {
    try {
        const response = await fetch('/api/notifications/create/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({
                message: message,
                category: category
            })
        });

        if (!response.ok) {
            console.error('Failed to create notification:', await response.text());
        }
    } catch (error) {
        console.error('Error creating notification:', error);
    }
}

// Function to show notifications
function showNotification(message , category = 'New book alert') {
    const notif = document.createElement('div');
    notif.className = 'custom-notification';
    notif.textContent = message;
    document.body.appendChild(notif);
    // Add animation classes
    notif.style.animation = 'slide-in 0.5s forwards, fade-out 0.5s 2.5s forwards';

    // Remove the notification after the animation ends
    setTimeout(() => {
        notif.remove();
    }, 3000); // Matches total animation duration (0.5s slide-in + 2.5s display + 0.5s fade-out)

    handleNotification(message, category);
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

document.addEventListener('DOMContentLoaded', async function () {
    // Add custom notification styles if they don't exist
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
                /* Animation defined in showNotification function */
            }

            @keyframes slide-in {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }

            @keyframes fade-out {
                from { opacity: 1; }
                to { opacity: 0; }
            }
             /* Style for disabled borrow button */
            .book-btn.borrow-btn:disabled {
                background-color: #ccc; /* Grey out */
                cursor: not-allowed;
                opacity: 0.7;
            }
             .book-btn.borrow-btn:disabled:hover {
                background-color: #ccc; /* Keep grey on hover */
                box-shadow: none;
             }

             /* Optional: Styles for availability badges */
             .availability-badge.available {
                 background-color: #4CAF50; /* Green */
             }
             .availability-badge.unavailable {
                 background-color: #F44336; /* Red */
             }
              .availability-badge {
                 display: inline-block;
                 padding: 4px 8px;
                 border-radius: 4px;
                 color: white;
                 font-size: 0.8em;
                 margin-right: 5px;
                 margin-bottom: 5px; /* Add margin for better spacing with other indicators */
             }
             .format-indicator {
                 display: inline-block;
                 padding: 2px 6px;
                 border: 1px solid #ccc;
                 border-radius: 4px;
                 font-size: 0.7em;
                 margin-right: 5px;
                 margin-bottom: 5px;
             }
              .copies-count {
                display: inline-block;
                padding: 2px 6px;
                border: 1px solid #ccc;
                border-radius: 4px;
                font-size: 0.7em;
                margin-right: 5px;
                margin-bottom: 5px;
            }
             .availability {
                margin-top: 10px; /* Space above availability info */
             }
             .book-details p {
                 margin-bottom: 5px; /* Space below author */
             }
             .book-details h3 {
                 margin-bottom: 5px; /* Space below title */
             }
             /* Style for the Low Stock badge, which we will now also use for "Digital Available" */
             .availability-badge.low-stock {
                 background-color: #f39c12; /* Orange */
                 color: white;
             }

        `;
        document.head.appendChild(notificationStyles);
    }


    const bookGrid = document.querySelector('.book-grid');
    // Clear loading message or initial content
    bookGrid.innerHTML = '';

    // --- Fetch User's Favorite Book IDs ---
    // This should ideally happen only if the user is authenticated.
    // Assuming your Django views handle authentication and return 401 if not logged in.
    try {
        const response = await fetch('/api/user/favorites/');
        if (response.ok) {
            const favorites = await response.json();
            // Store just the book IDs for quick lookup
            currentUserFavorites = favorites.map(fav => fav.book_id);
        } else {
             // If not authenticated or error, currentUserFavorites remains empty, which is fine.
             console.warn('Could not fetch user favorites. User might not be logged in or an error occurred.');
             // No need to show a user-facing notification for this unless it's critical
        }
    } catch (error) {
        console.error('Error fetching user favorites:', error);
         // No need to show a user-facing notification for this unless it's critical
    }


    // --- Fetch Books and Display ---
    async function fetchAndDisplayBooks(params = new URLSearchParams()) {
        bookGrid.innerHTML = '<div class="loading-message">Loading books...</div>'; // Show loading message

        try {
            const response = await fetch(`/api/books/?${params.toString()}`);
            if (!response.ok) {
                throw new Error('Failed to fetch books');
            }
            const books = await response.json();

            bookGrid.innerHTML = ''; // Clear loading message and previous books

            if (books.length === 0) {
                const noResults = document.createElement('div');
                noResults.className = 'no-results';
                noResults.textContent = params.has('q') || params.has('genre') || params.has('sort') || params.has('availability') || params.has('format')
                    ? 'No books found matching your criteria.'
                    : 'No books available in the catalog.';
                bookGrid.appendChild(noResults);
            } else {
                 books.forEach(book => {
                     const bookItem = addBookToDisplay(book);
                     bookGrid.appendChild(bookItem);
                 });
            }

        } catch (error) {
            console.error('Error fetching books:', error);
            bookGrid.innerHTML = '<div class="error-message">Failed to load books. Please try again later.</div>'; // Display error message
            showNotification("❌ Failed to load books");
        }
    }

    // Initial fetch and display of books
    fetchAndDisplayBooks();

    // Search and filter functionality
    const searchForm = document.querySelector('.search-form');
    const searchInput = document.querySelector('.search-input');
    const filterSelects = document.querySelectorAll('.filter-select');

    searchForm.addEventListener('submit', function (e) {
        e.preventDefault();
        filterBooks();
    });

    filterSelects.forEach(select => {
        select.addEventListener('change', filterBooks);
    });

    function filterBooks() {
        const searchTerm = searchInput.value.trim(); // Trim whitespace
        const genreFilter = document.querySelector('.filter-group select:nth-child(1)').value;
        const formatFilter = document.querySelector('.filter-group select:nth-child(2)').value;
        const sortBy = document.querySelector('.filter-group select:nth-child(3)').value;
        const availabilityFilter = document.querySelector('.filter-group select:nth-child(4)').value;


        const params = new URLSearchParams();
        if (searchTerm) params.append('q', searchTerm);
        if (genreFilter) params.append('genre', genreFilter);
        if (formatFilter) params.append('format', formatFilter);
        if (sortBy) params.append('sort', sortBy);
        if (availabilityFilter) params.append('availability', availabilityFilter);

        fetchAndDisplayBooks(params);
    }
});