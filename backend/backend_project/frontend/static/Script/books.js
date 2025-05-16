const loggedInUser = JSON.parse(localStorage.getItem('loggedIn_user'));
const usersData = JSON.parse(localStorage.getItem('users_data')) || [];
const userIndex = usersData.findIndex(u => u && u.username === loggedInUser?.username);


function initializeUserData() {
    if (!loggedInUser) {
        const defaultUser = {
            username: 'guest',
            profile_info: 'Guest User',
            profile_image_url: '../CSS/assets/default_profile.png',
            borrowed_books: [],
            borrowing_history: [],
            favorite_books: []
        };
        localStorage.setItem('loggedIn_user', JSON.stringify(defaultUser));
        return defaultUser;
    }

    if (!loggedInUser.borrowed_books) loggedInUser.borrowed_books = [];
    if (!loggedInUser.borrowing_history) loggedInUser.borrowing_history = [];
    if (!loggedInUser.favorite_books) loggedInUser.favorite_books = [];

    localStorage.setItem('loggedIn_user', JSON.stringify(loggedInUser));
    return loggedInUser;
}

const userData = initializeUserData();

const sampleBooks = [
    {
        id: '1',
        title: 'A Song of Ice and Fire',
        author: 'R.R. Martin',
        coverPath: './../CSS/assets/book_cover.jpg',
        genre: 'fantasy',
        format: 'hardcover',
        pubYear: '2018',
        availability: 'available',
        borrowNum: '25',
        lateFees: '5',
        description: 'A Song of Ice and Fire is Martin\'s epic fantasy saga...',
        borrowersList: []
    },
    {
        id: '2',
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        coverPath: './../CSS/assets/The_Great_Gatsby_Cover.jpg',
        genre: 'classic',
        format: 'paperback',
        pubYear: '1925',
        availability: 'low-stock',
        borrowNum: '42',
        lateFees: '3',
        description: 'The novel was inspired by a youthful romance Fitzgerald had...',
        borrowersList: []
    },
    {
        id: '3',
        title: 'To Kill a Mockingbird',
        author: 'Harper Lee',
        coverPath: './../CSS/assets/cover3.jpg',
        genre: 'fiction',
        format: 'hardcover',
        pubYear: '1960',
        availability: 'unavailable',
        borrowNum: '37',
        lateFees: '4',
        description: 'The story unfolds as her father, Atticus Finch...',
        borrowersList: []
    }
];

function addBookToDisplay(book) {
    const bookItem = document.createElement('div');
    bookItem.className = 'book-item';
    bookItem.id = `_${book.book_id}`;

    bookItem.innerHTML = `
        <button class="star-button"><i class="fas fa-star"></i></button>
        <div class="book-cover">
            <img src="${book.cover_image_url}" alt="${book.title} book cover">
        </div>
        <div class="book-details">
            <h3 class="book-title">${book.title}</h3>
            <p class="book-author">By ${book.author_name}</p>
            <div class="book-meta">
                <span class="meta-item">${book.genre_name || 'Unknown'}</span>
                <span class="meta-item">${book.publication_year || 'Unknown'}</span>
            </div>
            <div class="availability">
                <span class="availability-badge ${book.is_available ? 'available' : 'unavailable'}">
                    ${book.is_available ? 'Available' : 'Not Available'}
                </span>
            </div>
            <div class="book-actions">
                <a href="/book-details?id=${book.book_id}" class="book-btn details-btn">Details</a>
                ${book.is_available ? 
                    `<button class="book-btn borrow-btn" data-book-id="${book.book_id}">Borrow</button>` :
                    `<button class="book-btn borrow-btn" disabled>Not Available</button>`
                }
            </div>
        </div>
    `;

    // Add borrow button event listener
    const borrowBtn = bookItem.querySelector('.borrow-btn');
    if (!borrowBtn.disabled) {
        borrowBtn.addEventListener('click', async () => {
            try {
                const response = await fetch(`/api/books/${book.book_id}/borrow/`, {
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

    return bookItem;
}

function isBookBorrowed(bookId) {
    if (!userData.borrowed_books) return false;
    return userData.borrowed_books.some(borrowedBook => borrowedBook.id === bookId);
}

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

    const bookGrid = document.querySelector('.book-grid');
    bookGrid.innerHTML = '';

    // Function to show notifications
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

    // Fetch books from backend
    try {
        const response = await fetch('/api/books/');
        if (!response.ok) {
            throw new Error('Failed to fetch books');
        }
        const books = await response.json();

        books.forEach(book => {
            const bookItem = addBookToDisplay(book);
            bookGrid.appendChild(bookItem);
        });

        if (books.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'no-results';
            noResults.textContent = 'No books found.';
            bookGrid.appendChild(noResults);
        }

    } catch (error) {
        console.error('Error fetching books:', error);
        showNotification("❌ Failed to load books");
    }

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

    async function filterBooks() {
        const searchTerm = searchInput.value;
        const genreFilter = filterSelects[0].value;
        const sortBy = filterSelects[1].value;
        const availabilityFilter = filterSelects[2].value;

        try {
            const params = new URLSearchParams({
                q: searchTerm,
                genre: genreFilter,
                sort: sortBy,
                availability: availabilityFilter
            });

            const response = await fetch(`/api/books/?${params}`);
            if (!response.ok) {
                throw new Error('Failed to fetch filtered books');
            }

            const books = await response.json();
            bookGrid.innerHTML = '';

            books.forEach(book => {
                const bookItem = addBookToDisplay(book);
                bookGrid.appendChild(bookItem);
            });

            if (books.length === 0) {
                const noResults = document.createElement('div');
                noResults.className = 'no-results';
                noResults.textContent = 'No books found matching your criteria.';
                bookGrid.appendChild(noResults);
            }

        } catch (error) {
            console.error('Error filtering books:', error);
            showNotification("❌ Failed to filter books");
        }
    }
});
