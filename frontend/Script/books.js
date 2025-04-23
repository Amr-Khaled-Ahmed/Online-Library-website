const loggedInUser = JSON.parse(localStorage.getItem('loggedIn_user'));
const usersData = JSON.parse(localStorage.getItem('users_data')) || [];
const userIndex = usersData.findIndex(u => u.username === loggedInUser.username);

// Reset user borrowed books
// loggedInUser.borrowed_books = [];
// localStorage.setItem('loggedIn_user',JSON.stringify(loggedInUser));
// usersData[userIndex] = loggedInUser;
// localStorage.setItem('users_data',JSON.stringify(usersData));

document.querySelectorAll('.star-button').forEach(button => {
    button.addEventListener('click', (event) => {
        event.stopPropagation();
        button.classList.toggle('active');
    });
});

// Define sample books
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
        description: 'A Song of Ice and Fire is Martin\'s epic fantasy saga, spanning thousands of pages, which captured the imagination of millions and inspired the HBO hit show Game of Thrones.'
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
        description: 'The novel was inspired by a youthful romance Fitzgerald had with socialite Ginevra King, and the riotous parties he attended on Long Island\'s North Shore in 1922.'
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
        description: 'The story unfolds as her father, Atticus Finch, a principled lawyer, defends Tom Robinson, a Black man falsely accused of raping a white woman.'
    }
];

// Function to add book from data
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

// Initialize local storage with sample books if not already populated
document.addEventListener('DOMContentLoaded', function() {
    // Check if books exist in local storage
    if(!localStorage.getItem('books') || JSON.parse(localStorage.getItem('books')).length === 0) {
        // Initialize with sample books
        localStorage.setItem('books', JSON.stringify(sampleBooks));
    }
    
    // Get books from local storage
    const books = JSON.parse(localStorage.getItem('books'));
    
    // Get the book grid container
    const bookGrid = document.querySelector('.book-grid');
    
    // Clear existing static content
    bookGrid.innerHTML = '';
    
    // Add books from local storage to the display
    books.forEach(book => {
        const bookItem = addBookToDisplay(book);
        bookGrid.appendChild(bookItem);

        document.querySelector(`#_${book.id} .borrow-btn`).addEventListener('click',() => {
            let borrowed_book = {
                id: book.id,
                borrowDate: new Date()
            };

            let borrowedAlready = false;
            loggedInUser.borrowed_books.forEach(ubb => {
                if(ubb.id == book.id)
                    borrowedAlready = true;
            });
            if(borrowedAlready) {
                // Display Notification
                let alertNotification = document.querySelector('.alert');
                alertNotification.classList.remove('hide');
                alertNotification.style.animation = 'notification 1.7s ease-in-out 2s backwards';
                alertNotification.addEventListener('animationend', () => {
                    alertNotification.classList.add('hide');
                    alertNotification.style.animation = '';
                },{once: true});
                return;
            }

            loggedInUser.borrowed_books.push(borrowed_book);
            localStorage.setItem('loggedIn_user',JSON.stringify(loggedInUser));

            usersData[userIndex] = loggedInUser;
            localStorage.setItem('users_data',JSON.stringify(usersData));

            let user = {
                username: loggedInUser.username,
                profilePic: loggedInUser.profilePic,
                borrowDate: new Date()
            };

            books.forEach(bookel => {
                if(bookel.id == book.id) {
                    bookel.borrowersList.push(user);
                    bookel.borrowNum = String(parseInt(bookel.borrowNum) + 1);
                }
            });
            localStorage.setItem('books',JSON.stringify(books));

            // Display Notification
            let borrowedNotification = document.querySelector('.borrowed');
            borrowedNotification.classList.remove('hide');
            borrowedNotification.style.animation = 'notification 1.7s ease-in-out 2s backwards';
            borrowedNotification.addEventListener('animationend', () => {
                borrowedNotification.classList.add('hide');
                borrowedNotification.style.animation = '';
            },{once: true});
        });
        
        // Add event listeners to star buttons
        const starButton = bookItem.querySelector('.star-button');
        starButton.addEventListener('click', (event) => {
            event.stopPropagation();
            starButton.classList.toggle('active');
        });
    });
    
    // Setup search functionality
    const searchForm = document.querySelector('.search-form');
    const searchInput = document.querySelector('.search-input');
    const filterSelects = document.querySelectorAll('.filter-select');
    
    searchForm.addEventListener('submit', function(e) {
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
        
        // Clear the book grid
        bookGrid.innerHTML = '';
        
        // Filter and sort books
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
        
        // Sort the filtered books
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
        
        // Display the filtered books
        filteredBooks.forEach(book => {
            const bookItem = addBookToDisplay(book);
            bookGrid.appendChild(bookItem);
            
            // Add event listeners to star buttons
            const starButton = bookItem.querySelector('.star-button');
            starButton.addEventListener('click', (event) => {
                event.stopPropagation();
                starButton.classList.toggle('active');
            });
        });
        
        // Show message if no books found
        if (filteredBooks.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'no-results';
            noResults.textContent = 'No books found matching your criteria.';
            bookGrid.appendChild(noResults);
        }
    }
});
