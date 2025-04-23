document.addEventListener('DOMContentLoaded', function() {
    
    const urlParams = new URLSearchParams(window.location.search);
    const bookId = urlParams.get('id');

    // Get books from localStorage
    const books = JSON.parse(localStorage.getItem('books'));
    
    // Find the book with matching ID
    const book = books.find(b => b.id === bookId);

    // Update the page with book details
    document.querySelector('.book-title').textContent = book.title;
    document.querySelector('.book-author').textContent = `By ${book.author}`;
    document.querySelector('.book-cover img').src = book.coverPath;
    document.querySelector('.book-description').textContent = book.description;
    document.querySelector('.book-year').textContent = book.pubYear;
    document.querySelector('.book-status').textContent = book.availability;
    document.querySelector('.book-genre').textContent = book.genre;
    
}); 