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

    const urlParams = new URLSearchParams(window.location.search);
    const bookId = urlParams.get('id');

    // Get the list of books from localStorage
    const books = JSON.parse(localStorage.getItem('books')) || [];
    const book = books.find(b => b.id === bookId);

    if (!book) {
        showNotification("❌ Book not found.");
        return;
    }

    // Display book info
    document.querySelector('.book-title').textContent = book.title || "No title";
    document.querySelector('.book-author').textContent = `By ${book.author || "Unknown"}`;
    document.querySelector('.book-cover img').src = book.coverPath;
    document.querySelector('.book-description').textContent = book.description || "No description.";
    document.querySelector('.book-status').textContent = book.availability || "Available";
    document.querySelector('.book-genre').textContent = book.genre || "Unknown";
    document.querySelector('.book-year').textContent = book.pubYear || "Unknown";

    const borrowBtn = document.querySelector(".btn");
    if (borrowBtn) {
        borrowBtn.addEventListener("click", () => {
            const currentUser = JSON.parse(localStorage.getItem("loggedIn_user"));
            if (!currentUser) {
                console.log('entered');
                showNotification("🔒 You must be logged in to borrow a book.");
                return;
            }
            const allUsers = JSON.parse(localStorage.getItem("users_data")) || [];
            const userIndex = allUsers.findIndex(u => u.username === currentUser.username);
            if (!currentUser.borrowed_books) currentUser.borrowed_books = [];
            const alreadyBorrowed = currentUser.borrowed_books.some(b => b.id === book.id);
            if (alreadyBorrowed) {
                console.log('entered');
                showNotification("⚠️ This book is already borrowed!");
                return;
            }

            const borrowDate = new Date();
            const dueDate = new Date();
            dueDate.setDate(borrowDate.getDate() + 21);

            const borrowedBook = {
                id: book.id,
                title: book.title,
                author: book.author,
                coverPath: book.coverPath || '',
                borrowDate: borrowDate.toISOString(),
                dueDate: dueDate.toISOString()
            };

            // Add to the user's borrowed books
            currentUser.borrowed_books.push(borrowedBook);
            localStorage.setItem("loggedIn_user", JSON.stringify(currentUser));

            // Find the original book and mark it as borrowed
            const bookIndex = books.findIndex(b => b.id === book.id);
            if (bookIndex !== -1) {
                const borrowedBookCopy = { ...book, borrowed: true };
                books[bookIndex] = borrowedBookCopy;
                localStorage.setItem("books", JSON.stringify(books));
            }

            if (userIndex !== -1) {
                allUsers[userIndex] = currentUser;
                localStorage.setItem("users_data", JSON.stringify(allUsers));
            }

            showNotification("✅ Book borrowed successfully!");
        });
    }

});


function showNotification(message) {
    const notif = document.createElement('div');
    notif.className = 'custom-notification';
    notif.textContent = message;
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 3000);
}
