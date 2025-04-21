document.addEventListener('DOMContentLoaded', () => {
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

    // Render favorites on page load
    renderFavorites();

    // Handle click on star button to add/remove books from favorites
    document.querySelectorAll('.star-button').forEach(button => {
        const details = button.closest('.borrowed-details');
        const title = details.querySelector('.borrowed-title')?.textContent.trim();
        const author = details.querySelector('.borrowed-author')?.textContent.trim().replace(/^By\s*/, '');

        const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
        const isFavorite = favorites.some(b => b.title === title && b.author === author);

        if (isFavorite) {
            button.classList.add('active');
        }

        button.addEventListener('click', event => {
            event.stopPropagation();
            button.classList.toggle('active');

            const format = [...details.querySelectorAll('.info-item')].find(el =>
                el.querySelector('.info-label')?.textContent === 'Format'
            )?.querySelector('.info-value')?.textContent.trim();

            const book = { title, author, format };
            let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

            const exists = favorites.some(b => b.title === title && b.author === author);

            if (button.classList.contains('active')) {
                if (!exists) {
                    favorites.push(book);
                    localStorage.setItem('favorites', JSON.stringify(favorites));
                }
            } else {
                favorites = favorites.filter(b => !(b.title === title && b.author === author));
                localStorage.setItem('favorites', JSON.stringify(favorites));
            }

            renderFavorites();
        });
    });

    // Handle the modal confirmation actions for deleting a book from favorites
    confirmYes.addEventListener('click', () => {
        if (bookToDelete && bookToDeleteData) {
            let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
            favorites = favorites.filter(b => !(b.title === bookToDeleteData.title && b.author === bookToDeleteData.author));
            localStorage.setItem('favorites', JSON.stringify(favorites));

            // Update matching star button
            document.querySelectorAll('.star-button').forEach(button => {
                const details = button.closest('.borrowed-details');
                const title = details.querySelector('.borrowed-title')?.textContent.trim();
                const author = details.querySelector('.borrowed-author')?.textContent.trim().replace(/^By\s*/, '');

                if (title === bookToDeleteData.title && author === bookToDeleteData.author) {
                    button.classList.remove('active');
                }
            });

            renderFavorites();
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
    function renderFavorites() {
        const container = document.getElementById('favorites');
        container.innerHTML = '';
        const favorites = JSON.parse(localStorage.getItem('favorites')) || [];

        favorites.forEach(book => {
            const item = document.createElement('div');
            item.classList.add('favorite-item');
            item.innerHTML = `
                <div class="favorite-cover">
                    <i class="fas fa-book-open"></i>
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
    }

    // Handle borrowed item click events for modal display
    const closeBtn = document.querySelector('.close-btn');
    const borrowedItems = document.querySelectorAll('.borrowed-item');

    borrowedItems.forEach(item => {
        item.addEventListener('click', function(event) {
            if (event.target.closest('button')) return; // Prevent modal open if button clicked

            const title = this.querySelector('.borrowed-title').textContent;
            const author = this.querySelector('.borrowed-author').textContent;
            const cover = this.querySelector('.borrowed-cover img')?.src || '';
            const borrowedDate = this.querySelector('.info-item:nth-child(1) .info-value').textContent;
            const dueDate = this.querySelector('.info-item:nth-child(2) .info-value').textContent;
            const status = this.querySelector('.status-badge').textContent;
            const format = this.querySelector('.info-item:nth-child(4) .info-value').textContent;
            const renewals = this.querySelector('.info-item:nth-child(3) .info-value').textContent;

            document.getElementById('modal-title').textContent = title;
            document.getElementById('modal-author').textContent = author;
            document.getElementById('modal-image').src = cover;
            document.getElementById('modal-borrowed-date').textContent = borrowedDate;
            document.getElementById('modal-due-date').textContent = dueDate;
            document.getElementById('modal-status').textContent = status;
            document.getElementById('modal-format').textContent = format;
            document.getElementById('modal-renewals').textContent = renewals;

            document.getElementById('borrowed-modal').style.display = 'block';
        });
    });

    // Close modal
    closeBtn.addEventListener('click', () => {
        document.getElementById('borrowed-modal').style.display = 'none';
    });

    // Close modal if clicked outside
    window.addEventListener('click', (event) => {
        const modal = document.getElementById('borrowed-modal');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Handle notifications for "coming soon" features
    document.querySelectorAll('.return-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const notif = document.createElement('div');
            notif.className = 'custom-notification';
            notif.textContent = '🔙 Return feature coming in the next phase!';
            document.body.appendChild(notif);
            setTimeout(() => notif.remove(), 3000);
        });
    });

    document.querySelectorAll('.renew-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const notif = document.createElement('div');
            notif.className = 'custom-notification';
            notif.textContent = '🔙 Renew feature coming in the next phase!';
            document.body.appendChild(notif);
            setTimeout(() => notif.remove(), 3000);
        });
    });
});
