// All things
document.addEventListener('DOMContentLoaded', function() {

    // Example of book object
    const book1 = {
        title: 'Child of The Kindred',
        author: 'Ahmed',
        coverPath: './../CSS/assets/ChildOfTheKindred_ebook1.jpg',
        genre: 'fantasy',
        format: 'paperback',
        pubYear: '2010',
        availability: 'unavailable',
        borrowNum: '10',
        maxDuration: '1',
        lateFees: '10'
    };

    const book2 = {
        title: 'ahild of The Kindred',
        author: 'Basem',
        coverPath: './../CSS/assets/ChildOfTheKindred_ebook1.jpg',
        genre: 'fantasy',
        format: 'paperback',
        pubYear: '2021',
        availability: 'unavailable',
        borrowNum: '100',
        maxDuration: '1',
        lateFees: '10'
    };

    // Will be retrieved from database
    let books = [];
    for(let i = 0; i < 6; ++i)
        books.push(book1);
    for(let i = 0; i < 6; ++i)
        books.push(book2);

    // Backup
    let allBooks = [...books];

    // View all books
    allBooks.forEach((book,i) => {
        addBook('_'+i,book);
    });
    if(allBooks.length == 0)
        document.querySelector('.no-results').classList.remove('hide');

    // Will contains Books that the user searches for
    let searchedBooks = [];

    // Search
    let searchInput = document.querySelector('.search-input');
    let availabilitySelector = document.querySelector('.availability-selector');
    let genreSelector = document.querySelector('.genre-selector');
    let formatSelector = document.querySelector('.format-selector');
    let sortSelector = document.querySelector('.sort-selector');

    document.addEventListener('input', () => {
        // Loading
        let overlayer = document.querySelector('.overlayer');
        let loading = document.querySelector('.loading');
        overlayer.classList.remove('hide');
        loading.classList.remove('hide');
        setTimeout(() => {
            overlayer.classList.add('hide');
            loading.classList.add('hide');
        },300);
        // Input by user
        const searchTerm = searchInput.value.trim().toLowerCase();
        const availabilityInput = availabilitySelector.value.toLowerCase();
        const genreInput = genreSelector.value.toLowerCase();
        const formatInput = formatSelector.value.toLowerCase();
        const sortInput = sortSelector.value.toLowerCase();

        searchedBooks = allBooks.filter(book => {
            // Book info
            const title = book.title.trim().toLowerCase();
            const author = book.author.trim().toLowerCase();
            const availability = book.availability;
            const genre = book.genre;
            const format = book.format;

            return ((title.includes(searchTerm) || author.includes(searchTerm) || searchTerm === '')
                && (availability === availabilityInput || availabilityInput === 'all' || availabilityInput === '')
                && (genre === genreInput || genreInput === 'all' || genreInput === '')
                && (format === formatInput || formatInput === 'all' || formatInput === ''));
        });

        // Sort the searchedBooks
        if(sortInput === 'newest')
            searchedBooks = sortByAttribute(searchedBooks, 'pubYear', 'desc');
        else if(sortInput === 'oldest')
            searchedBooks = sortByAttribute(searchedBooks, 'pubYear', 'asc');
        else if(sortInput === 'title-asc')
            searchedBooks = sortByAttribute(searchedBooks, 'title', 'asc');
        else if(sortInput === 'title-desc')
            searchedBooks = sortByAttribute(searchedBooks, 'title', 'desc');
        else if(sortInput === 'author-asc')
            searchedBooks = sortByAttribute(searchedBooks, 'author', 'asc');
        else if(sortInput === 'author-desc')
            searchedBooks = sortByAttribute(searchedBooks, 'author', 'desc');
        else if(sortInput === 'popular')
            searchedBooks = sortByAttribute(searchedBooks, 'borrowNum', 'desc');

        // clear all books from page
        unviewBooks();

        // Add books that user wants
        searchedBooks.forEach((book,i) => {
            addBook('_'+i,book);
        });
        if(searchedBooks.length == 0)
            document.querySelector('.no-results').classList.remove('hide');
        else
            document.querySelector('.no-results').classList.add('hide');
    });


    document.getElementById('add-book').addEventListener('click',() => {
        window.location.href = "./add_edit.html";
    })

    window.addEventListener('load', () => {
        if (sessionStorage.getItem('showMessage') === 'true') {
            let savedNotification = document.querySelector('.saved');
            savedNotification.classList.remove('hide');
            savedNotification.style.animation = 'notification 1.7s ease-in-out 2s backwards';
            savedNotification.addEventListener('animationend', () => {
                savedNotification.classList.add('hide');
                savedNotification.style.animation = '';
            },{once: true});
            sessionStorage.removeItem('showMessage');
        }
    });
});

function sortByAttribute(books, attribute, order) {
    return books.sort((a,b) => {
        if(order === 'asc')
            return a[attribute].toLowerCase() > b[attribute].toLowerCase() ? 1 : -1;
        else
            return a[attribute].toLowerCase() < b[attribute].toLowerCase() ? 1 : -1;
    });
}

// view no books
function unviewBooks() {
    const container = document.getElementById('books-container');
    while (container.firstChild) {
            container.removeChild(container.firstChild);
    }
}

// Confirm to delete book
function deleteBook(book) {
    let overlayer = document.querySelector('.overlayer');
    let confirmation = document.querySelector('.confirmation');
    let deleteNotification = document.querySelector('.deleted');
    overlayer.classList.remove('hide');
    confirmation.classList.remove('hide');

    return new Promise((resolve) => {
        document.getElementById('confirm-delete').addEventListener('click',() => {
            confirmation.style.animation = 'delete 1.7s ease-in-out backwards';

            confirmation.addEventListener('animationend',() => {
                confirmation.style.animation = '';
                overlayer.classList.add('hide');
                confirmation.classList.add('hide');
                resolve(true);
                deleteNotification.classList.remove('hide');
                deleteNotification.style.animation = 'notification 1.7s ease-in-out 2s backwards';
                deleteNotification.addEventListener('animationend',() => {
                    deleteNotification.style.animation = '';
                    deleteNotification.classList.add('hide');
                },{once: true});
            },{once: true});
        });

        document.getElementById('cancel-delete').addEventListener('click',() => {
            confirmation.style.animation = 'cancel 1.7s ease-in-out backwards';

            confirmation.addEventListener('animationend',() => {
                confirmation.style.animation = '';
                overlayer.classList.add('hide');
                confirmation.classList.add('hide');
                resolve(false);
            },{once: true});
        });
    });
}

async function handleDelete(book) {
    const willDelete = await deleteBook(book);
    if(willDelete)
        console.log('Deleted');
}

// Add book
// Book Data will be dynamic in backend phase
function addBook(id,book) {
    let bookContainer = document.createElement('div');
    bookContainer.classList.add('book');
    bookContainer.id = id;

    let imgHolder = document.createElement('div');
    imgHolder.classList.add('img-holder');

    let img = document.createElement('img');
    img.classList.add('book-cover');
    img.src = book.coverPath;
    img.alt = "Book Cover";

    imgHolder.appendChild(img);

    let title = document.createElement('p');
    title.classList.add('book-title');
    title.textContent = book.title;

    let author = document.createElement('p');
    author.classList.add('author');
    author.textContent = 'By ' + book.author;

    let bookInfo = document.createElement('div');
    bookInfo.classList.add('book-information');

    let bookGenre = document.createElement('label');
    bookGenre.classList.add('book-genre');
    bookGenre.classList.add(book.genre);
    bookGenre.htmlFor = "book";
    bookGenre.textContent = book.genre[0].toUpperCase() + book.genre.slice(1);

    let bookFormat = document.createElement('label');
    bookFormat.classList.add('book-format');
    bookFormat.classList.add(book.format);
    bookFormat.htmlFor = "book";
    bookFormat.textContent = book.format[0].toUpperCase() + book.format.slice(1);

    let bookpubYear = document.createElement('label');
    bookpubYear.classList.add('book-year-pub');
    bookpubYear.htmlFor = "book";
    bookpubYear.textContent = book.pubYear;

    bookInfo.appendChild(bookGenre);
    bookInfo.appendChild(bookFormat);
    bookInfo.appendChild(bookpubYear);

    let bookStatus = document.createElement('div');
    bookStatus.classList.add('book-status');

    let availability = document.createElement('label');
    availability.htmlFor = "book";
    availability.textContent = book.availability[0].toUpperCase() + book.availability.slice(1);
    availability.classList.add(book.availability);
    availability.classList.add('availability');

    let borrowNum = document.createElement('label');
    borrowNum.htmlFor = "book";
    borrowNum.textContent = book.borrowNum + ' Borrows';
    if(book.borrowNum <= 5)
        borrowNum.classList.add('lvl1-borrow');
    else if(book.borrowNum <= 15)
        borrowNum.classList.add('lvl2-borrow');
    else if(book.borrowNum <= 30)
        borrowNum.classList.add('lvl3-borrow');
    else if(book.borrowNum <= 50)
        borrowNum.classList.add('lvl4-borrow');
    else
        borrowNum.classList.add('lvl5-borrow');

    let lateFees = document.createElement('label');
    lateFees.classList.add('late-fees');
    lateFees.htmlFor = "book";
    lateFees.textContent = 'Late Fee: ' + book.lateFees + '$';


    let borrowDuration = document.createElement('label');
    borrowDuration.classList.add('borrow-duration');
    borrowDuration.htmlFor = "book";
    borrowDuration.textContent = 'Max Borrow Duration: ' + book.maxDuration + ' month';

    bookStatus.appendChild(availability);
    bookStatus.appendChild(borrowNum);
    bookStatus.appendChild(lateFees);
    bookStatus.appendChild(borrowDuration);

    let btns = document.createElement('div');
    btns.classList.add('buttons');

    let editBtn = document.createElement('button');
    editBtn.classList.add('edit','add-edit');
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', function() {
        const dataParams = new URLSearchParams();
        for(const [key,value] of Object.entries(book)) {
            dataParams.append(key,value);
        }
        window.sessionStorage.setItem('edit','true');
        window.location.href = `./add_edit.html?${dataParams.toString()}`;
    });

    let deleteBtn = document.createElement('button');
    deleteBtn.classList.add('delete');
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click',() => {
        let img = document.querySelector('.confirmation img');
        let title = document.querySelector('.confirmation .book-title');
        let author = document.querySelector('.confirmation .author');
        img.src = book.coverPath;
        title.textContent = book.title;
        author.textContent = book.author;
    },{once: true});
    deleteBtn.addEventListener('click',() => handleDelete(book));


    let brListBtn = document.createElement('button');
    brListBtn.classList.add('borrowers-list');
    brListBtn.innerHTML = '<pre> Borrowers List <i class="fa fa-angle-right" aria-hidden="true"></i> </pre>';
    brListBtn.addEventListener('click',() => {
        
    });

    btns.appendChild(editBtn);
    btns.appendChild(deleteBtn);
    btns.appendChild(brListBtn);

    bookContainer.appendChild(imgHolder);
    bookContainer.appendChild(title);
    bookContainer.appendChild(author);
    bookContainer.appendChild(bookInfo);
    bookContainer.appendChild(bookStatus);
    bookContainer.appendChild(btns);

    let booksContainer = document.getElementById('books-container');
    booksContainer.appendChild(bookContainer);
}

 
const sampleBook = {
    cover: "./../CSS/assets/ChildOfTheKindred_ebook1.jpg",
    title: "Child Of The Kindred ",
    author: "John Doe",
    genre: "Sci-Fi",
    isbn: "123456789",
    format: "Paperback",
    availability: "Available",
    description: "A thrilling journey through Saturn's icy moon."
};

document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("book-modal");
    const closeModal = document.getElementById("close-modal");

    document.querySelector("#books-container").addEventListener("click", (e) => {
        const book = sampleBook; 
        document.getElementById("modal-book-cover").src = book.cover;
        document.getElementById("modal-book-title").textContent = book.title;
        document.getElementById("modal-book-author").textContent = book.author;
        document.getElementById("modal-book-genre").textContent = book.genre;
        document.getElementById("modal-book-isbn").textContent = book.isbn;
        document.getElementById("modal-book-format").textContent = book.format;
        document.getElementById("modal-book-availability").textContent = book.availability;
        document.getElementById("modal-book-description").textContent = book.description;

        modal.classList.remove("hidden");
    });

    closeModal.addEventListener("click", () => {
        modal.classList.add("hidden");
    });

    window.addEventListener("click", (e) => {
        if (e.target === modal) {
            modal.classList.add("hidden");
        }
    });
});
