
let books = [];
let allBooks = [];

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
    for(let i = 0; i < 6; ++i)
        books.push(book1);
    for(let i = 0; i < 6; ++i)
        books.push(book2);

    // Backup
    allBooks = [...books];

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
        if (window.sessionStorage.getItem('save') === 'true') {
            window.sessionStorage.removeItem('save','true');
            // Display Notification
            let savedNotification = document.querySelector('.saved');
            savedNotification.classList.remove('hide');
            savedNotification.style.animation = 'notification 1.7s ease-in-out 2s backwards';
            savedNotification.addEventListener('animationend', () => {
                savedNotification.classList.add('hide');
                savedNotification.style.animation = '';
            },{once: true});

            // Add Book to page (temporary), no need with database
            const bookParams = new URLSearchParams(window.location.search);
            const bookData = {
                title: bookParams.get('title'),
                author: bookParams.get('author'),
                coverPath: window.sessionStorage.getItem('coverPath'),
                genre: bookParams.get('genre'),
                format: bookParams.get('format'),
                pubYear: bookParams.get('pubYear'),
                availability: bookParams.get('availability'),
                borrowNum: bookParams.get('borrowNum'),
                maxDuration: bookParams.get('maxDuration'),
                lateFees: bookParams.get('lateFees')
            };
            window.sessionStorage.removeItem('coverPath',window.sessionStorage.getItem('coverPath'));

            if(window.sessionStorage.getItem('edit') === 'true') {
                let book = document.querySelector(`#${window.sessionStorage.getItem('editedBook')}`);
                let oldData = JSON.parse(book.dataset.info);
                book.dataset.info = JSON.stringify(bookData);

                editBook(book.id,bookData,oldData);

                books.splice(books.indexOf(oldData),1);

                window.sessionStorage.removeItem('edit','true');
                window.sessionStorage.removeItem('editedBook',book.id);
            }
            else {
                addBook(books.length,bookData);
            }
            books.push(bookData);

            // Add book to database

            // Reload
            // location.reload(true);
            
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
    const books = Array.from(document.getElementById('books-container').children);
    books.forEach((book) => {
        document.getElementById('books-container').removeChild(book);
    });
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

async function handleDelete(id,book) {
    const willDelete = await deleteBook(book);
    if(willDelete) {
        // Delete book from page (temporary), no need with database
        let container = Array.from(document.getElementById('books-container').children);
        container.forEach(book => {
            if(book.id == id)
                document.getElementById('books-container').removeChild(book);
        });
        books.remove(book);

        // Delete from database


        // Reload when deleted from database
        //location.reload(true);
    }
}

// Add book
// Book Data will be dynamic in backend phase
function addBook(id,book) {
    let bookContainer = document.createElement('div');
    bookContainer.classList.add('book');
    bookContainer.id = id;


    let bookJSON = JSON.stringify(book);
    bookContainer.dataset.info = bookJSON;


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
    borrowNum.classList.add(borrowLevel(Number(book.borrowNum)));

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
        for(const [key,value] of Object.entries(JSON.parse(bookContainer.dataset.info))) {
            dataParams.append(key,value);
        }
        window.sessionStorage.setItem('edit','true');
        window.sessionStorage.setItem('editedBook',id);
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
    deleteBtn.addEventListener('click',() => handleDelete(id,book));


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

function editBook(id,newData,oldData) {
    let title = document.querySelector(`#${id} .book-title`);
    title.textContent = newData.title;

    let author = document.querySelector(`#${id} .author`);
    author.textContent = 'By ' + newData.author;

    let img = document.querySelector(`#${id} .book-cover`);
    img.src = newData.coverPath;

    let genre = document.querySelector(`#${id} .book-genre`);
    genre.textContent = newData.genre[0].toUpperCase() + newData.genre.slice(1);
    genre.classList.remove(oldData.genre);
    genre.classList.add(newData.genre);

    let format = document.querySelector(`#${id} .book-format`);
    format.textContent = newData.format[0].toUpperCase() + newData.format.slice(1);
    format.classList.remove(oldData.format);
    format.classList.add(newData.format);

    let availability = document.querySelector(`#${id} .availability`);
    availability.textContent = newData.availability[0].toUpperCase() + newData.availability.slice(1);
    availability.classList.remove(oldData.availability);
    availability.classList.add(newData.availability);

    let borrowNum = document.querySelector(`#${id} .${borrowLevel(Number(oldData.borrowNum))}`);
    borrowNum.textContent = newData.borrowNum + ' Borrows';
    borrowNum.classList.remove(oldData.borrowNum);
    borrowNum.classList.add(newData.borrowNum);

    let lateFees = document.querySelector(`#${id} .late-fees`);
    lateFees.textContent = 'Late Fee: ' + newData.lateFees + '$';

    let borrowDuration = document.querySelector(`#${id} .borrow-duration`);
    borrowDuration.textContent = 'Max Borrow Duration: ' + newData.maxDuration + ' month';
}

function borrowLevel(borrowNum) {
    if(borrowNum <= 5)
        return 'lvl1-borrow';
    else if(borrowNum <= 15)
        return 'lvl2-borrow';
    else if(borrowNum <= 30)
        return 'lvl3-borrow';
    else if(borrowNum <= 50)
        return 'lvl4-borrow';
    else
        return 'lvl5-borrow';
}
