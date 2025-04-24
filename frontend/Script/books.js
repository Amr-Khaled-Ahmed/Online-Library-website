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
    bookItem.id = `_${book.id}`;
    bookItem.dataset.info = JSON.stringify(book);

    bookItem.innerHTML = `
        <button class="star-button"><i class="fas fa-star"></i></button>
        <div class="book-cover">
            <img src="${book.coverPath}" alt="${book.title} book cover">
        </div>
        <div class="book-details">
            <h3 class="book-title">${book.title}</h3>
            <p class="book-author">By ${book.author}</p>
            <div class="book-meta">
                <span class="meta-item">${book.genre[0].toUpperCase() + book.genre.slice(1)}</span>
                <span class="meta-item">${book.format[0].toUpperCase() + book.format.slice(1)}</span>
                <span class="meta-item">${book.pubYear}</span>
            </div>
            <div class="availability">
                <span class="availability-badge ${book.availability}">${book.availability[0].toUpperCase() + book.availability.slice(1)}</span>
            </div>
            <div class="book-actions">
                <a href="./book_details.html?id=${encodeURIComponent(book.id)}" class="book-btn details-btn">Details</a>
                <a href="#" class="book-btn borrow-btn">Borrow</a>
            </div>
        </div>
    `;

    return bookItem;
}

function isBookBorrowed(bookId) {
    if (!userData.borrowed_books) return false;
    return userData.borrowed_books.some(borrowedBook => borrowedBook.id === bookId);
}

document.addEventListener('DOMContentLoaded', function () {
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

    if (!localStorage.getItem('books') || JSON.parse(localStorage.getItem('books')).length === 0) {
        localStorage.setItem('books', JSON.stringify(sampleBooks));
    }

    const books = JSON.parse(localStorage.getItem('books'));
    const bookGrid = document.querySelector('.book-grid');
    bookGrid.innerHTML = '';

    function handleBorrowBook(book, event) {
        event.preventDefault();

        const currentUser = JSON.parse(localStorage.getItem('loggedIn_user'));
        const currentUsersData = JSON.parse(localStorage.getItem('users_data')) || [];
        const currentUserIndex = currentUsersData.findIndex(u => u && u.username === currentUser?.username);

        if (!currentUser.borrowed_books) currentUser.borrowed_books = [];

        const isAlreadyBorrowed = currentUser.borrowed_books.some(b =>
            b.id === book.id
        );
        if (isAlreadyBorrowed) {
            const notif = document.createElement('div');
            notif.className = 'custom-notification';
            notif.textContent = '⚠️ This book is already borrowed!';
            document.body.appendChild(notif);
            setTimeout(() => notif.remove(), 3000);
            return;
        }

        const currentDate = new Date();
        const dueDate = new Date(currentDate);
        dueDate.setDate(dueDate.getDate() + 21);

        const borrowedBook = {
            id: book.id,
            title: book.title,
            author: book.author,
            coverPath: book.coverPath,
            format: book.format,
            borrowDate: currentDate.toISOString(),
            dueDate: dueDate.toISOString(),
            renewals: 2,
            returned: false,
            overdue: false
        };

        currentUser.borrowed_books.push(borrowedBook);
        localStorage.setItem('loggedIn_user', JSON.stringify(currentUser));

        if (currentUserIndex !== -1) {
            currentUsersData[currentUserIndex].borrowed_books = currentUser.borrowed_books;
            localStorage.setItem('users_data', JSON.stringify(currentUsersData));
        }

        if (!book.borrowersList) book.borrowersList = [];
        const borrower = {
            username: currentUser.username,
            email: currentUser.email,
            profilePic: currentUser.profile_image_url || '../CSS/assets/blue.avif',
            borrowDate: currentDate.toISOString(),
            dueDate: dueDate.toISOString()
        };
        book.borrowersList.push(borrower);

        book.borrowNum = String(parseInt(book.borrowNum) + 1);

        const updatedBooks = books.map(b => b.id === book.id ? book : b);
        localStorage.setItem('books', JSON.stringify(updatedBooks));

        const notif = document.createElement('div');
        notif.className = 'custom-notification';
        notif.textContent = '✅ Book borrowed successfully!';
        document.body.appendChild(notif);
        setTimeout(() => notif.remove(), 3000);
    }

    books.forEach(book => {
        const bookItem = addBookToDisplay(book);
        bookGrid.appendChild(bookItem);

        const borrowBtn = bookItem.querySelector('.borrow-btn');
        borrowBtn.addEventListener('click', handleBorrowBook.bind(null, book));

        const starButton = bookItem.querySelector('.star-button');

        // Highlight if already favorite
        if (userData.favorite_books?.some(fav => fav.title === book.title)) {
            starButton.classList.add('active');
        }

        // Star button event
        starButton.addEventListener('click', (event) => {
            event.stopPropagation();

            const currentUser = JSON.parse(localStorage.getItem('loggedIn_user'));
            const usersData = JSON.parse(localStorage.getItem('users_data')) || [];
            const userIndex = usersData.findIndex(u => u && u.username === currentUser?.username);

            if (!currentUser.favorite_books) currentUser.favorite_books = [];

            const isFavorite = currentUser.favorite_books.some(fav => fav.title === book.title);

            if (isFavorite) {
                currentUser.favorite_books = currentUser.favorite_books.filter(fav => fav.title !== book.title);
                starButton.classList.remove('active');
            } else {
                currentUser.favorite_books.push({
                    id: book.id,
                    title: book.title,
                    author: book.author,
                    coverPath: book.coverPath,
                    format : book.format
                });
                starButton.classList.add('active');
            }

            localStorage.setItem('loggedIn_user', JSON.stringify(currentUser));

            if (userIndex !== -1) {
                usersData[userIndex].favorite_books = currentUser.favorite_books;
                localStorage.setItem('users_data', JSON.stringify(usersData));
            }
        });
    });

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
        const searchTerm = searchInput.value.toLowerCase();
        const genreFilter = filterSelects[0].value;
        const formatFilter = filterSelects[1].value;
        const sortBy = filterSelects[2].value;
        const availabilityFilter = filterSelects[3].value;

        bookGrid.innerHTML = '';

        let filteredBooks = books.filter(book => {
            const matchesSearch = book.title.toLowerCase().includes(searchTerm) ||
                book.author.toLowerCase().includes(searchTerm);
            const matchesGenre = genreFilter === '' || book.genre === genreFilter;
            const matchesFormat = formatFilter === '' || book.format === formatFilter;
            const matchesAvailability = availabilityFilter === '' ||
                availabilityFilter === 'all' ||
                book.availability === availabilityFilter;

            return matchesSearch && matchesGenre && matchesFormat && matchesAvailability;
        });

        if (sortBy === 'newest') {
            filteredBooks.sort((a, b) => b.pubYear - a.pubYear);
        } else if (sortBy === 'oldest') {
            filteredBooks.sort((a, b) => a.pubYear - b.pubYear);
        } else if (sortBy === 'title-asc') {
            filteredBooks.sort((a, b) => a.title.localeCompare(b.title));
        } else if (sortBy === 'title-desc') {
            filteredBooks.sort((a, b) => b.title.localeCompare(a.title));
        } else if (sortBy === 'author-asc') {
            filteredBooks.sort((a, b) => a.author.localeCompare(b.author));
        } else if (sortBy === 'author-desc') {
            filteredBooks.sort((a, b) => b.author.localeCompare(a.author));
        } else if (sortBy === 'popular') {
            filteredBooks.sort((a, b) => b.borrowNum - a.borrowNum);
        }

        filteredBooks.forEach(book => {
            const bookItem = addBookToDisplay(book);
            bookGrid.appendChild(bookItem);

            const borrowBtn = bookItem.querySelector('.borrow-btn');
            borrowBtn.addEventListener('click', handleBorrowBook.bind(null, book));

            const starButton = bookItem.querySelector('.star-button');

            if (userData.favorite_books?.some(fav => fav.title === book.title)) {
                starButton.classList.add('active');
            }

            starButton.addEventListener('click', (event) => {
                event.stopPropagation();

                const currentUser = JSON.parse(localStorage.getItem('loggedIn_user'));
                const usersData = JSON.parse(localStorage.getItem('users_data')) || [];
                const userIndex = usersData.findIndex(u => u && u.username === currentUser?.username);

                if (!currentUser.favorite_books) currentUser.favorite_books = [];

                const isFavorite = currentUser.favorite_books.some(fav => fav.title === book.title);

                if (isFavorite) {
                    currentUser.favorite_books = currentUser.favorite_books.filter(fav => fav.title !== book.title);
                    starButton.classList.remove('active');
                } else {
                    currentUser.favorite_books.push({
                        id: book.id,
                        title: book.title,
                        author: book.author,
                        coverPath: book.coverPath,
                        format : book.format
                    });
                    starButton.classList.add('active');
                }

                localStorage.setItem('loggedIn_user', JSON.stringify(currentUser));

                if (userIndex !== -1) {
                    usersData[userIndex].favorite_books = currentUser.favorite_books;
                    localStorage.setItem('users_data', JSON.stringify(usersData));
                }
            });
        });

        if (filteredBooks.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'no-results';
            noResults.textContent = 'No books found matching your criteria.';
            bookGrid.appendChild(noResults);
        }
    }
});
