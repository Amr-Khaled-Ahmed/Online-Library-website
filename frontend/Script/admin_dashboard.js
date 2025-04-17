// All things
document.addEventListener('DOMContentLoaded', function() {
    for(let i = 0; i < 6; ++i)
        addBook('_'+i);

    document.getElementById('add-book').addEventListener('click',() => {
        window.location.href = "./add_edit.html";
    })

    // Search
    let searchInput = document.querySelector('.search-input');
    let availabilitySelector = document.querySelector('.availability-selector');
    let genreSelector = document.querySelector('.genre-selector');
    let formatSelector = document.querySelector('.format-selector');
    let sortSelector = document.querySelector('.sort-selector');
    let books = document.querySelectorAll('.book');

    document.addEventListener('input', () => {
        // Input by user
        const searchTerm = searchInput.value.trim().toLowerCase();
        const availabilityInput = availabilitySelector.value.toLowerCase();
        const genreInput = genreSelector.value.toLowerCase();
        const formatInput = formatSelector.value.toLowerCase();
        const sortInput = sortSelector.value.toLowerCase();

        books.forEach(book => {
            // Book info
            const title = document.querySelector(`#${book.id} .book-title`).textContent.trim().toLowerCase();
            const author = document.querySelector(`#${book.id} .author`).textContent.trim().toLowerCase().slice(2);
            const availability = document.querySelector(`#${book.id} .availability`);
            const genre = document.querySelector(`#${book.id} .book-genre`);
            const format = document.querySelector(`#${book.id} .book-format`);

            if((title.includes(searchTerm) || author.includes(searchTerm) || searchTerm === '')
                && (availability.classList.contains(availabilityInput) || availabilityInput === 'all' || availabilityInput === '')
                && (genre.classList.contains(genreInput) || genreInput === 'all' || genreInput === '')
                && (format.classList.contains(formatInput) || formatInput === 'all' || formatInput === '')) {
                book.classList.remove('hide');
            }
            else {
                book.classList.add('hide');
            }
        });
    });

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

// Confirm to delete book
function deleteBook(book) {
    let overlayer = document.querySelector('.overlayer');
    let confirmation = document.querySelector('.confirmation');
    let deleteNotification = document.querySelector('.deleted');
    overlayer.classList.remove('hide');

    return new Promise((resolve) => {
        document.getElementById('confirm-delete').addEventListener('click',() => {
            confirmation.style.animation = 'delete 1.7s ease-in-out backwards';

            confirmation.addEventListener('animationend',() => {
                confirmation.style.animation = '';
                overlayer.classList.add('hide');
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

    const bookData = {
        title: 'Child of The Kindred',
        author: 'By M. T. Magee',
        coverPath: './../CSS/assets/ChildOfTheKindred_ebook1.jpg',
        genre: 'fantasy',
        format: 'paperback',
        yearPub: '2020',
        availability: 'unavailable',
        borrowNum: '10',
        maxDuration: '1',
        lateFees: '10'
    };

    let imgHolder = document.createElement('div');
    imgHolder.classList.add('img-holder');

    let img = document.createElement('img');
    img.classList.add('book-cover');
    img.src = bookData.coverPath;
    img.alt = "Book Cover";

    imgHolder.appendChild(img);

    let title = document.createElement('p');
    title.classList.add('book-title');
    title.textContent = bookData.title;

    let author = document.createElement('p');
    author.classList.add('author');
    author.textContent = bookData.author;

    let bookInfo = document.createElement('div');
    bookInfo.classList.add('book-information');

    let bookGenre = document.createElement('label');
    bookGenre.classList.add('book-genre');
    bookGenre.classList.add(bookData.genre);
    bookGenre.htmlFor = "book";
    bookGenre.textContent = bookData.genre[0].toUpperCase() + bookData.genre.slice(1);

    let bookFormat = document.createElement('label');
    bookFormat.classList.add('book-format');
    bookFormat.classList.add(bookData.format);
    bookFormat.htmlFor = "book";
    bookFormat.textContent = bookData.format[0].toUpperCase() + bookData.format.slice(1);

    let bookYearPub = document.createElement('label');
    bookYearPub.classList.add('book-year-pub');
    bookYearPub.htmlFor = "book";
    bookYearPub.textContent = bookData.yearPub;

    bookInfo.appendChild(bookGenre);
    bookInfo.appendChild(bookFormat);
    bookInfo.appendChild(bookYearPub);

    let bookStatus = document.createElement('div');
    bookStatus.classList.add('book-status');

    let availability = document.createElement('label');
    availability.htmlFor = "book";
    availability.textContent = bookData.availability[0].toUpperCase() + bookData.availability.slice(1);
    availability.classList.add(bookData.availability);
    availability.classList.add('availability');

    let borrowNum = document.createElement('label');
    borrowNum.htmlFor = "book";
    borrowNum.textContent = bookData.borrowNum + ' Borrows';
    if(bookData.borrowNum <= 5)
        borrowNum.classList.add('lvl1-borrow');
    else if(bookData.borrowNum <= 15)
        borrowNum.classList.add('lvl2-borrow');
    else if(bookData.borrowNum <= 30)
        borrowNum.classList.add('lvl3-borrow');
    else if(bookData.borrowNum <= 50)
        borrowNum.classList.add('lvl4-borrow');
    else
        borrowNum.classList.add('lvl5-borrow');

    let lateFees = document.createElement('label');
    lateFees.classList.add('late-fees');
    lateFees.htmlFor = "book";
    lateFees.textContent = 'Late Fee: ' + bookData.lateFees + '$';


    let borrowDuration = document.createElement('label');
    borrowDuration.classList.add('borrow-duration');
    borrowDuration.htmlFor = "book";
    borrowDuration.textContent = 'Max Borrow Duration: ' + bookData.maxDuration + ' month';

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
        for(const [key,value] of Object.entries(bookData)) {
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
        img.src = bookData.coverPath;
        title.textContent = bookData.title;
        author.textContent = bookData.author;
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