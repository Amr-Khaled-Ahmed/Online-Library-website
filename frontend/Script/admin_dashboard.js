// Confirm to delete book
function deleteBook(book) {
    let response = confirm("Are you sure to delete this book?");
    if(response) {
        console.log('Deleted');
    }
}

// Add book
// All // will be dynamic
function addBook(book) {
    let bookContainer = document.createElement('div');
    bookContainer.classList.add('book');

    let imgHolder = document.createElement('div');
    imgHolder.classList.add('img-holder');

    let img = document.createElement('img');
    img.classList.add('book-cover');
    img.src = "./../CSS/assets/ChildOfTheKindred_ebook1.jpg"; //
    img.alt = "Book Cover";

    imgHolder.appendChild(img);

    let title = document.createElement('p');
    title.classList.add('book-title');
    title.textContent = 'Child of The Kindred'; //

    let author = document.createElement('p');
    author.classList.add('author');
    author.textContent = 'By M. T. Magee'; //

    let bookInfo = document.createElement('div');
    bookInfo.classList.add('book-information');

    let bookGenre = document.createElement('label');
    bookGenre.classList.add('book-genre');
    bookGenre.htmlFor = "book";
    bookGenre.textContent = 'Fantasy'; //

    let bookFormat = document.createElement('label');
    bookFormat.classList.add('book-format');
    bookFormat.htmlFor = "book";
    bookFormat.textContent = 'Paperback'; //

    let bookYearPub = document.createElement('label');
    bookYearPub.classList.add('book-year-pub');
    bookYearPub.htmlFor = "book";
    bookYearPub.textContent = '2020'; //

    bookInfo.appendChild(bookGenre);
    bookInfo.appendChild(bookFormat);
    bookInfo.appendChild(bookYearPub);

    let bookStatus = document.createElement('div');
    bookStatus.classList.add('book-status');

    let availability = document.createElement('label');
    availability.htmlFor = "book";
    availability.textContent = 'Unavailable'; //
    let y = 'Unavailable';
    if(y === 'Available')
        availability.classList.add('available');
    else
        availability.classList.add('unavailable');

    let borrowNum = document.createElement('label');
    borrowNum.htmlFor = "book";
    borrowNum.textContent = '10' + ' Borrows'; //
    let x = 10;
    if(x <= 5)
        borrowNum.classList.add('lvl1-borrow');
    else if(x <= 15)
        borrowNum.classList.add('lvl2-borrow');
    else if(x <= 30)
        borrowNum.classList.add('lvl3-borrow');
    else if(x <= 50)
        borrowNum.classList.add('lvl4-borrow');
    else
        borrowNum.classList.add('lvl5-borrow');

    let lateFees = document.createElement('label');
    lateFees.classList.add('late-fees');
    lateFees.htmlFor = "book";
    lateFees.textContent = 'Late Fee: ' + '10' + '$'; //


    let borrowDuration = document.createElement('label');
    borrowDuration.classList.add('borrow-duration');
    borrowDuration.htmlFor = "book";
    borrowDuration.textContent = 'Max Borrow Duration: ' + '1' + 'month'; //

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
        window.location.href = "./add_edit.html";
    });

    let deleteBtn = document.createElement('button');
    deleteBtn.classList.add('delete');
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click',() => deleteBook(book));

    let brListBtn = document.createElement('button');
    brListBtn.classList.add('borrowers-list');
    brListBtn.innerHTML = '<pre> Borrowers List <i class="fa fa-angle-right" aria-hidden="true"></i> </pre>';
    brListBtn.addEventListener('click',() => toBorrowersList(book));

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


// Get Borrowers list for a book
function toBorrowersList(book) {

}


// All things
document.addEventListener('DOMContentLoaded', function() {
    for(let i = 0; i < 6; ++i)
        addBook();

    document.getElementById('add-book').addEventListener('click',() => {
        window.location.href = "./add_edit.html";
    })
});