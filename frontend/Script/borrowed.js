const loggedInUser = JSON.parse(localStorage.getItem('loggedIn_user')) || { favorite_books: [] };
const usersData = JSON.parse(localStorage.getItem('users_data')) || [];
const userIndex = usersData.findIndex(u => u && u.username === loggedInUser.username);

document.addEventListener('DOMContentLoaded', () => {
    // Add custom notification styles
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

    // Initialize favorite_books array if it doesn't exist
    if (!loggedInUser.favorite_books) {
        loggedInUser.favorite_books = [];
        localStorage.setItem('loggedIn_user', JSON.stringify(loggedInUser));
        if (userIndex !== -1) {
            usersData[userIndex].favorite_books = [];
            localStorage.setItem('users_data', JSON.stringify(usersData));
        }
    }

    // Initialize borrowed_books array if it doesn't exist
    if (!loggedInUser.borrowed_books) {
        loggedInUser.borrowed_books = [];
        localStorage.setItem('loggedIn_user', JSON.stringify(loggedInUser));
        if (userIndex !== -1) {
            usersData[userIndex].borrowed_books = [];
            localStorage.setItem('users_data', JSON.stringify(usersData));
        }
    }

    // Initialize borrowing_history array if it doesn't exist
    if (!loggedInUser.borrowing_history) {
        loggedInUser.borrowing_history = [];
        localStorage.setItem('loggedIn_user', JSON.stringify(loggedInUser));
        if (userIndex !== -1) {
            usersData[userIndex].borrowing_history = [];
            localStorage.setItem('users_data', JSON.stringify(usersData));
        }
    }

    // Ensure to trigger hash checking once DOM is ready
    if (window.location.hash === "#favorites") {
      document.getElementById("tab3").checked = true;
    }
    
    // Add book notification
    const addBookBtn = document.getElementById('add_book');
    if (addBookBtn) {
        addBookBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const notif = document.createElement('div');
            notif.className = 'custom-notification';
            notif.textContent = '🚧 Book adding feature coming in the next phase!';
            document.body.appendChild(notif);
            setTimeout(() => {
                notif.remove();
            }, 3000);
        });
    }

    let bookToDelete = null;
    let bookToDeleteData = null;

    const modal = document.getElementById('confirm-modal');
    const confirmYes = document.getElementById('confirm-yes');
    const confirmNo = document.getElementById('confirm-no');

    // Setup localStorage change detection
    let lastUserData = JSON.stringify(loggedInUser);
    
    // Function to check for changes in localStorage and refresh content
    function checkForChanges() {
        const currentUserData = localStorage.getItem('loggedIn_user');
        
        if (currentUserData !== lastUserData) {
            // User data has changed, update our reference
            const updatedUserData = JSON.parse(currentUserData);
            
            // Update the global loggedInUser reference to ensure all functions use the latest data
            Object.assign(loggedInUser, updatedUserData);
            
            // Re-render all components with the updated data
            renderCurrentBorrows(updatedUserData);
            renderBorrowingHistory(updatedUserData);
            renderFavorites(updatedUserData);
            
            // Update our reference
            lastUserData = currentUserData;
        }
    }
    
    // Check for changes periodically (every 2 seconds)
    const refreshInterval = setInterval(checkForChanges, 2000);
    
    // Clear interval when page is unloaded
    window.addEventListener('beforeunload', () => {
        clearInterval(refreshInterval);
    });

    // Render current borrowed books
    renderCurrentBorrows();
    
    // Render borrowing history
    renderBorrowingHistory();
    
    // Render favorites on page load
    renderFavorites();

    // Setup star buttons for all borrowed items
    setupStarButtons();
    
    // Handle renew and return buttons
    setupBorrowedItemsActions();

    // Function to render current borrowed books from localStorage
    function renderCurrentBorrows(userData = null) {
        const container = document.getElementById('current-borrows');
        if (!container) return;
        
        // Clear existing static content
        container.innerHTML = '';
        
        // Use provided userData or get from loggedInUser
        const data = userData || loggedInUser;
        const borrowedBooks = data.borrowed_books || [];
        
        if (borrowedBooks.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-favorites';
            emptyMessage.innerHTML = `
                <i class="fas fa-book"></i>
                <p>You don't have any borrowed books.</p>
                <p>Visit the <a href="books.html">Books</a> page to borrow some!</p>
            `;
            container.appendChild(emptyMessage);
            return;
        }
        
        borrowedBooks.forEach(book => {
            const borrowDate = new Date(book.borrowDate);
            const dueDate = new Date(book.dueDate);
            
            // Calculate status
            const today = new Date();
            const diffTime = dueDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            let statusClass = 'on-time';
            let statusText = 'Not due soon';
            
            if (diffDays < 0) {
                statusClass = 'overdue';
                statusText = 'Overdue';
            } else if (diffDays === 1) {
                statusClass = 'due-tomorrow';
                statusText = 'Due tomorrow';
            } else if (diffDays <= 3) {
                statusClass = 'due-soon';
                statusText = `Due in ${diffDays} days`;
            }
            
            const borrowedItem = document.createElement('div');
            borrowedItem.className = 'borrowed-item';
            borrowedItem.innerHTML = `
                <div class="borrowed-cover">
                    ${book.coverPath ? 
                        `<img src="${book.coverPath}" alt="${book.title} cover">` : 
                        `<i class="fas fa-book-open"></i>`}
                </div>
                <div class="borrowed-details">
                    <button class="star-button"><i class="fas fa-star"></i></button>
                    <h3 class="borrowed-title">${book.title}</h3>
                    <p class="borrowed-author">By ${book.author}</p>

                    <div class="borrowed-info">
                        <div class="info-item">
                            <span class="info-label">Borrowed On</span>
                            <span class="info-value">${formatDate(borrowDate)}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Due Date</span>
                            <span class="info-value">${formatDate(dueDate)}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Renewals Left</span>
                            <span class="info-value">${typeof book.renewals === 'number' ? book.renewals : 2}/2</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Format</span>
                            <span class="info-value">${book.format || 'Unknown'}</span>
                        </div>
                    </div>

                    <span class="status-badge ${statusClass}">${statusText}</span>

                    <div class="action-buttons">
                        <button class="renew-btn">Renew</button>
                        <button class="return-btn">Return</button>
                    </div>
                </div>
            `;
            
            container.appendChild(borrowedItem);
        });
        
        // Set up event handlers for the newly added elements
        refreshItemsFunctionality();
    }
    
    // Function to render borrowing history from localStorage
    function renderBorrowingHistory(userData = null) {
        const container = document.getElementById('borrowing-history');
        if (!container) return;
        
        // Clear existing static content
        container.innerHTML = '';
        
        // Use provided userData or get from loggedInUser
        const data = userData || loggedInUser;
        const borrowingHistory = data.borrowing_history || [];
        
        if (borrowingHistory.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-favorites';
            emptyMessage.innerHTML = `
                <i class="fas fa-history"></i>
                <p>You don't have any borrowing history yet.</p>
                <p>Returned books will appear here.</p>
            `;
            container.appendChild(emptyMessage);
            return;
        }
        
        // Sort by return date, most recent first
        borrowingHistory.sort((a, b) => {
            return new Date(b.returnDate) - new Date(a.returnDate);
        });
        
        borrowingHistory.forEach(book => {
            const borrowDate = new Date(book.borrowDate);
            const dueDate = new Date(book.dueDate);
            const returnDate = new Date(book.returnDate);
            
            // Check if returned late
            const isLate = returnDate > dueDate;
            
            const borrowedItem = document.createElement('div');
            borrowedItem.className = 'borrowed-item';
            
            // Create the HTML structure for the history item
            let itemHTML = `
                <div class="borrowed-cover">
                    ${book.coverPath ? 
                        `<img src="${book.coverPath}" alt="${book.title} cover">` : 
                        `<i class="fas fa-book-open"></i>`}
                </div>
                <div class="borrowed-details">
                    <button class="star-button"><i class="fas fa-star"></i></button>
                    <h3 class="borrowed-title">${book.title}</h3>
                    <p class="borrowed-author">By ${book.author}</p>

                    <div class="borrowed-info">
                        <div class="info-item">
                            <span class="info-label">Borrowed On</span>
                            <span class="info-value">${formatDate(borrowDate)}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Due Date</span>
                            <span class="info-value">${formatDate(dueDate)}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Returned On</span>
                            <span class="info-value">${formatDate(returnDate)}</span>
                        </div>`;
            
            // Add renewal info if the book was renewed
            if (book.renewedDate) {
                const renewedDate = new Date(book.renewedDate);
                const extendedDueDate = new Date(book.extendedDueDate);
                
                itemHTML += `
                        <div class="info-item">
                            <span class="info-label">Renewed On</span>
                            <span class="info-value">${formatDate(renewedDate)}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Extended Due Date</span>
                            <span class="info-value">${formatDate(extendedDueDate)}</span>
                        </div>`;
            }
            
            // Add format and close the divs
            itemHTML += `
                        <div class="info-item">
                            <span class="info-label">Format</span>
                            <span class="info-value">${book.format || 'Unknown'}</span>
                        </div>
                    </div>

                    <span class="status-badge ${isLate ? 'late-return' : 'returned'}">${isLate ? 'Returned Late' : 'Returned'}</span>
                </div>
            `;
            
            borrowedItem.innerHTML = itemHTML;
            container.appendChild(borrowedItem);
        });
        
        // Set up event handlers for the newly added elements
        refreshItemsFunctionality();
    }

    function setupStarButtons() {
        document.querySelectorAll('.star-button').forEach(button => {
            const details = button.closest('.borrowed-details');
            const title = details.querySelector('.borrowed-title')?.textContent.trim();
            const author = details.querySelector('.borrowed-author')?.textContent.trim().replace(/^By\s*/, '');
        
            let favorites = loggedInUser.favorite_books || [];
            const isFavorite = favorites.some(b => b.title === title && b.author === author);
        
            if (isFavorite) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
            
            newButton.addEventListener('click', event => {
                event.stopPropagation();
                newButton.classList.toggle('active');
    
                const formatElement = [...details.querySelectorAll('.info-item')].find(el =>
                    el.querySelector('.info-label')?.textContent === 'Format'
                );
                
                const format = formatElement 
                    ? formatElement.querySelector('.info-value')?.textContent.trim() 
                    : 'Unknown';
        
                let updatedFavorites = [...(loggedInUser.favorite_books || [])];
                const book = { title, author, format };
        
                if (newButton.classList.contains('active')) {
                    if (!updatedFavorites.some(b => b.title === title && b.author === author)) {
                        updatedFavorites.push(book);
                    }
                } 
                else {
                    updatedFavorites = updatedFavorites.filter(b => !(b.title === title && b.author === author));
                }
        
                loggedInUser.favorite_books = updatedFavorites;
                localStorage.setItem('loggedIn_user', JSON.stringify(loggedInUser));
                
                if (userIndex !== -1) {
                    usersData[userIndex].favorite_books = updatedFavorites;
                    localStorage.setItem('users_data', JSON.stringify(usersData));
                }
        
                renderFavorites();
                
                const notif = document.createElement('div');
                notif.className = 'custom-notification';
                notif.textContent = newButton.classList.contains('active') 
                    ? '⭐ Added to favorites!' 
                    : '⭐ Removed from favorites!';
                document.body.appendChild(notif);
                setTimeout(() => notif.remove(), 2000);
            });
        });
    }
    
    // Function to set up actions for borrowed items (renew and return)
    function setupBorrowedItemsActions() {
        // Handle renew buttons
        document.querySelectorAll('.renew-btn').forEach((btn) => {
            // If button is disabled, don't add functionality
            if (btn.disabled) return;
            
            // Clear existing event listeners
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Get book details
                const borrowedItem = newBtn.closest('.borrowed-item');
                if (!borrowedItem) return;
                
                const title = borrowedItem.querySelector('.borrowed-title').textContent;
                const renewalsItem = [...borrowedItem.querySelectorAll('.info-item')].find(el => 
                    el.querySelector('.info-label')?.textContent === 'Renewals Left'
                );
                
                // Extract current renewals left
                if (!renewalsItem) return;
                
                const renewalsText = renewalsItem.querySelector('.info-value').textContent;
                const [current, max] = renewalsText.split('/').map(n => parseInt(n.trim()));
                
                // Check if renewals are available
                if (current <= 0) {
                    const notif = document.createElement('div');
                    notif.className = 'custom-notification';
                    notif.textContent = '❌ No renewals left for this book!';
                    document.body.appendChild(notif);
                    setTimeout(() => notif.remove(), 3000);
                    return;
                }
                
                // Find the book in user's borrowed books
                const borrowedBooks = loggedInUser.borrowed_books || [];
                const bookIndex = borrowedBooks.findIndex(book => book.title === title);
                
                if (bookIndex === -1) return;
                
                // Get the book
                const book = borrowedBooks[bookIndex];
                
                // Parse due date
                const dueDate = new Date(book.dueDate);
                
                // Add 7 days to due date
                dueDate.setDate(dueDate.getDate() + 7);
                
                // Store renewal information
                book.renewedDate = new Date().toISOString();
                book.extendedDueDate = dueDate.toISOString();
                
                // Update book
                book.dueDate = dueDate.toISOString();
                book.renewals = Math.max(0, (book.renewals || current) - 1);
                
                // Update display
                const dueDateItem = [...borrowedItem.querySelectorAll('.info-item')].find(el => 
                    el.querySelector('.info-label')?.textContent === 'Due Date'
                );
                
                if (dueDateItem) {
                    dueDateItem.querySelector('.info-value').textContent = formatDate(dueDate);
                }
                
                // Update renewals display
                renewalsItem.querySelector('.info-value').textContent = `${book.renewals}/${max}`;
                
                // Save changes
                loggedInUser.borrowed_books = borrowedBooks;
                localStorage.setItem('loggedIn_user', JSON.stringify(loggedInUser));
                
                if (userIndex !== -1) {
                    usersData[userIndex].borrowed_books = borrowedBooks;
                    localStorage.setItem('users_data', JSON.stringify(usersData));
                }
                
                // Show success notification
                const notif = document.createElement('div');
                notif.className = 'custom-notification';
                notif.textContent = '🔄 Book renewed for 7 more days!';
                document.body.appendChild(notif);
                setTimeout(() => notif.remove(), 3000);
                
                // Update status badge if necessary
                updateStatusBadge(borrowedItem, dueDate);
            });
        });
        
        // Handle return buttons
        document.querySelectorAll('.return-btn').forEach((btn) => {
            // Clear existing event listeners
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Get book details
                const borrowedItem = newBtn.closest('.borrowed-item');
                if (!borrowedItem) return;
                
                const title = borrowedItem.querySelector('.borrowed-title').textContent;
                
                // Check if book is overdue
                const statusBadge = borrowedItem.querySelector('.status-badge');
                const isOverdue = statusBadge && statusBadge.classList.contains('overdue');
                
                if (isOverdue) {
                    // Show overdue notification
                    const notif = document.createElement('div');
                    notif.className = 'custom-notification';
                    notif.textContent = '⚠️ Book return overdue, contact administrator';
                    document.body.appendChild(notif);
                    setTimeout(() => notif.remove(), 3000);
                    return;
                }
                
                // Find the book in user's borrowed books
                const borrowedBooks = loggedInUser.borrowed_books || [];
                const bookIndex = borrowedBooks.findIndex(book => book.title === title);
                
                if (bookIndex === -1) return;
                
                // Get the book
                const book = borrowedBooks[bookIndex];
                
                // Update the book in the books collection
                const booksCollection = JSON.parse(localStorage.getItem('books')) || [];
                const bookInCollection = booksCollection.find(b => b.id === book.id);
                
                if (bookInCollection && bookInCollection.borrowersList) {
                    // Remove the current user from borrowersList
                    bookInCollection.borrowersList = bookInCollection.borrowersList.filter(
                        borrower => borrower.username !== loggedInUser.username
                    );
                    
                    // Update books collection in localStorage
                    localStorage.setItem('books', JSON.stringify(booksCollection));
                }
                
                // Move book to borrowing history
                const borrowingHistory = loggedInUser.borrowing_history || [];
                
                // Create history record with return date
                const historyRecord = {
                    ...book,
                    returnDate: new Date().toISOString(),
                    returned: true
                };
                
                borrowingHistory.push(historyRecord);
                
                // Remove from borrowed books
                borrowedBooks.splice(bookIndex, 1);
                
                // Save changes
                loggedInUser.borrowed_books = borrowedBooks;
                loggedInUser.borrowing_history = borrowingHistory;
                localStorage.setItem('loggedIn_user', JSON.stringify(loggedInUser));
                
                if (userIndex !== -1) {
                    usersData[userIndex].borrowed_books = borrowedBooks;
                    usersData[userIndex].borrowing_history = borrowingHistory;
                    localStorage.setItem('users_data', JSON.stringify(usersData));
                }
                
                // Remove item from the UI
                borrowedItem.style.animation = 'fadeOut 0.5s forwards';
                borrowedItem.addEventListener('animationend', () => {
                    borrowedItem.remove();
                    
                    // Check if there are still borrowed items
                    const borrowedItems = document.querySelectorAll('#current-borrows .borrowed-item');
                    if (borrowedItems.length === 0) {
                        const emptyMessage = document.createElement('div');
                        emptyMessage.className = 'empty-favorites';
                        emptyMessage.innerHTML = `
                            <i class="fas fa-book"></i>
                            <p>You don't have any borrowed books.</p>
                            <p>Visit the <a href="books.html">Books</a> page to borrow some!</p>
                        `;
                        document.getElementById('current-borrows').appendChild(emptyMessage);
                    }
                    
                    // Re-render borrowing history to show the returned book
                    renderBorrowingHistory();
                });
                
                // Show success notification
                const notif = document.createElement('div');
                notif.className = 'custom-notification';
                notif.textContent = '✅ Book returned successfully!';
                document.body.appendChild(notif);
                setTimeout(() => notif.remove(), 3000);
            });
        });
    }
    
    // Helper function to update status badge based on due date
    function updateStatusBadge(borrowedItem, dueDate) {
        const statusBadge = borrowedItem.querySelector('.status-badge');
        if (!statusBadge) return;
        
        const today = new Date();
        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Remove existing classes
        statusBadge.classList.remove('overdue', 'due-tomorrow', 'due-soon', 'on-time');
        
        if (diffDays < 0) {
            statusBadge.classList.add('overdue');
            statusBadge.textContent = 'Overdue';
        } else if (diffDays === 1) {
            statusBadge.classList.add('due-tomorrow');
            statusBadge.textContent = 'Due in 1 day';
        } else if (diffDays <= 3) {
            statusBadge.classList.add('due-soon');
            statusBadge.textContent = `Due in ${diffDays} days`;
        } else {
            statusBadge.classList.add('on-time');
            statusBadge.textContent = 'Not due soon';
        }
    }
    
    // Helper function to format dates in a user-friendly way
    function formatDate(date) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }

    // Handle the modal confirmation actions for deleting a book from favorites
    confirmYes.addEventListener('click', () => {
        if (bookToDelete && bookToDeleteData) {
            // Use user-based favorites (matching the star button logic)
            let favorites = loggedInUser.favorite_books || [];
            favorites = favorites.filter(b => !(b.title === bookToDeleteData.title && b.author === bookToDeleteData.author));
    
            // Update user data and localStorage
            loggedInUser.favorite_books = favorites;
            localStorage.setItem('loggedIn_user', JSON.stringify(loggedInUser));
            
            if (userIndex !== -1) {
            usersData[userIndex].favorite_books = favorites;
            localStorage.setItem('users_data', JSON.stringify(usersData));
            }
    
            // Update matching star buttons
            document.querySelectorAll('.star-button').forEach(button => {
                const details = button.closest('.borrowed-details');
                const title = details.querySelector('.borrowed-title')?.textContent.trim();
                const author = details.querySelector('.borrowed-author')?.textContent.trim().replace(/^By\s*/, '');
    
                if (title === bookToDeleteData.title && author === bookToDeleteData.author) {
                    button.classList.remove('active');
                }
            });
    
            // Remove the item from UI
            bookToDelete.remove();
            
            // Re-render favorites to ensure consistency
            renderFavorites();
            
            // Show notification
            const notif = document.createElement('div');
            notif.className = 'custom-notification';
            notif.textContent = '🗑️ Book removed from favorites!';
            document.body.appendChild(notif);
            setTimeout(() => notif.remove(), 2000);
            
            bookToDelete = null;
            bookToDeleteData = null;
        }
        modal.classList.add('hidden');
    });

    confirmNo.addEventListener('click', () => {
        bookToDelete = null;
        bookToDeleteData = null;
        modal.classList.add('hidden');
    });

    // Render the favorite books
    function renderFavorites(userData = null) {
        const container = document.getElementById('favorites');
        if (!container) return; // Exit if container not found
        
        container.innerHTML = '';
        
        // Use provided userData or get from loggedInUser
        const data = userData || loggedInUser;
        const favorites = data.favorite_books || [];

        if (favorites.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.classList.add('empty-favorites');
            emptyMessage.innerHTML = `
                <i class="fas fa-star"></i>
                <p>You don't have any favorite books yet.</p>
                <p>Click the star icon on any book to add it to your favorites.</p>
            `;
            container.appendChild(emptyMessage);
            return;
        }

        favorites.forEach(book => {
            const item = document.createElement('div');
            item.classList.add('favorite-item');
            item.innerHTML = `
                <div class="favorite-cover">
                    <img src = "${book.coverPath}" alt = "Book cover" >
                </div>
                <div class="favorite-details">
                    <h3 class="favorite-title">${book.title}</h3>
                    <p class="favorite-author">By ${book.author}</p>
                    <div class="favorite-info">
                        <div class="info-item">
                            <span class="info-label">Format</span>
                            <span class="info-value">${book.format || 'Unknown'}</span>
                        </div>
                    </div>
                    <button class="delete_book" type="button">delete book</button>
                </div>
            `;
            const deleteBtn = item.querySelector('.delete_book');
            deleteBtn.addEventListener('click', () => {
                bookToDelete = item;
                bookToDeleteData = book;
                modal.classList.remove('hidden');
            });
            container.appendChild(item);
        });
        
        // Set up event handlers for the newly added elements
        refreshItemsFunctionality();
    }

    // Add CSS for fadeOut animation if it doesn't exist
    if (!document.getElementById('fadeOut-animation')) {
        const style = document.createElement('style');
        style.id = 'fadeOut-animation';
        style.textContent = `
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    // Set up modal functionality for dynamically created items
    function setupModalFunctionality() {
        const closeBtn = document.querySelector('.close-btn');
        const borrowedModal = document.getElementById('borrowed-modal');

        // Add click event to all borrowed items for modal display
        document.querySelectorAll('.borrowed-item').forEach(item => {
            item.addEventListener('click', function(event) {
                if (event.target.closest('button')) return; // Prevent modal open if button clicked

                const title = this.querySelector('.borrowed-title').textContent;
                const author = this.querySelector('.borrowed-author').textContent;
                const cover = this.querySelector('.borrowed-cover img')?.src || '';
                
                // Find info items
                const infoItems = this.querySelectorAll('.info-item');
                let borrowedDate = '';
                let dueDate = '';
                let renewals = '';
                let format = '';
                
                infoItems.forEach(item => {
                    const label = item.querySelector('.info-label').textContent;
                    const value = item.querySelector('.info-value').textContent;
                    
                    if (label === 'Borrowed On') borrowedDate = value;
                    else if (label === 'Due Date') dueDate = value;
                    else if (label === 'Renewals Left') renewals = value;
                    else if (label === 'Format') format = value;
                });
                
                const status = this.querySelector('.status-badge').textContent;

                // Set modal content
                document.getElementById('modal-title').textContent = title;
                document.getElementById('modal-author').textContent = author;
                document.getElementById('modal-image').src = cover || '';
                document.getElementById('modal-borrowed-date').textContent = borrowedDate;
                document.getElementById('modal-due-date').textContent = dueDate;
                document.getElementById('modal-status').textContent = status;
                document.getElementById('modal-format').textContent = format;
                document.getElementById('modal-renewals').textContent = renewals;

                // Show modal
                borrowedModal.style.display = 'block';
            });
        });

        // Close modal with close button
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                borrowedModal.style.display = 'none';
            });
        }

        // Close modal if clicked outside
        window.addEventListener('click', (event) => {
            if (event.target === borrowedModal) {
                borrowedModal.style.display = 'none';
            }
        });
    }
    
    // Set up functionality after rendering
    function refreshItemsFunctionality() {
        setupStarButtons();
        setupBorrowedItemsActions();
        setupModalFunctionality();
    }
    
    // Listen for tab changes to update functionality
    document.querySelectorAll('.tab-input').forEach(tab => {
        tab.addEventListener('change', () => {
            // Small delay to ensure DOM is updated
            setTimeout(() => {
                refreshItemsFunctionality();
            }, 100);
        });
    });

    // Initial setup of modal functionality
    setupModalFunctionality();
});
