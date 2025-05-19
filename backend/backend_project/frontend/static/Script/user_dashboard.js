const smallPage = document.getElementById("smallPage");
const closePage = document.getElementById("closePage");
const pageContent = document.getElementById("page_content");
const notificationItems = document.querySelectorAll(".notification-list li");
notificationItems.forEach(item => {
    item.addEventListener("click", function() {
        pageContent.textContent = item.textContent;
        smallPage.style.display = "block";
    });
});

closePage.addEventListener("click", function() {
    smallPage.style.display = "none";
});

window.addEventListener("click", function(event) {
    if (event.target === smallPage) {
        smallPage.style.display = "none";
    }
});

document.querySelectorAll('.star-button').forEach(button => {
    button.addEventListener('click', (event) => {
        event.stopPropagation();
        button.classList.toggle('active');
    });
});

// Handle book card clicks to open modal
const modal = document.getElementById("book-modal");
const closeModal = document.querySelector(".close-btn");

document.querySelectorAll(".book-card").forEach(card => {
    card.addEventListener("click", function () {
        const title = card.querySelector("h3").textContent;
        const author = card.querySelector("p:nth-child(2)").textContent.replace("Author: ", "");
        const genre = card.querySelector("p:nth-child(3)").textContent.replace("Genre: ", "");
        const img = card.querySelector("img")?.src || '';

        document.getElementById("modal-title").textContent = title;
        document.getElementById("modal-author").textContent = author;
        document.getElementById("modal-genre").textContent = genre;
        document.getElementById("modal-year").textContent = "2025";  
        document.getElementById("modal-status").textContent = "Available";
        document.getElementById("modal-description").textContent = `This is a short description about the book "${title}".`;
        document.getElementById("modal-language").textContent = "English";
        document.getElementById("modal-pages").textContent = "320";
        document.getElementById("modal-image").src = img;

        modal.classList.remove("hidden");
    });
});

closeModal.addEventListener("click", () => {
    modal.classList.add("hidden");
});

window.addEventListener("click", (e) => {
    if (e.target === modal) {
        modal.classList.add("hidden");
    }
});

let friends = JSON.parse(localStorage.getItem('friends')) || [];

function showPopup() {
    document.getElementById('popup').style.display = 'block';
}

function hidePopup() {
    document.getElementById('popup').style.display = 'none';
    document.getElementById('friend-name').value = '';
    document.getElementById('friend-email').value = '';
}

function toggleInputField() {
    const type = document.getElementById('entry-type').value;
    document.getElementById('name-field').style.display = type === 'name' ? 'block' : 'none';
    document.getElementById('email-field').style.display = type === 'email' ? 'block' : 'none';
}

function showAlert(message) {
    alert(message);
}

function showMessagePopup(message) {
    const popup = document.getElementById('message-popup');
    popup.textContent = message;
    popup.style.display = 'block';
    setTimeout(() => {
        popup.style.display = 'none';
        popup.textContent = '';
    }, 3000);
}


async function submitForm() {
    const type = document.getElementById('entry-type').value;
    const name = document.getElementById('friend-name').value.trim();
    const email = document.getElementById('friend-email').value.trim().toLowerCase();

    try {
        // Get all users to verify if the user exists
        const usersResponse = await fetch('/api/usersList', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });

        if (!usersResponse.ok) {
            showMessagePopup("Failed to fetch users list. Please try again.");
            return;
        }

        const userList = await usersResponse.json();
        console.log("Users list:", userList);

        // Make sure we're accessing the users array correctly
        const users = userList.users || userList;

        const matchedUser = users.find(user =>
            type === 'name'
                ? user.username.toLowerCase() === name.toLowerCase()
                : user.email.toLowerCase() === email.toLowerCase()
        );

        if (!matchedUser) {
            showMessagePopup("No user found with the provided info.");
            return;
        }


        // Get current friend list
        const friendsResponse = await fetch('/api/friends/', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });

        if (!friendsResponse.ok) {
            showMessagePopup("Failed to fetch your friends list. Please try again.");
            return;
        }

        const friends = await friendsResponse.json();
        console.log("Current friends:", friends);

        const alreadyFriend = friends.some(friend =>
            friend.email && matchedUser.email &&
            friend.email.toLowerCase() === matchedUser.email.toLowerCase()
        );
        console.log(matchedUser);

        if (alreadyFriend) {
            showMessagePopup("This user is already in your friend list.");
            return;
        }

        // Get CSRF token from cookie
        const csrftoken = getCookie('csrftoken');

        // Add friend via API
        const addResponse = await fetch('/api/friends/add/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            },
            credentials: 'include',
            body: JSON.stringify({
                name: matchedUser.username,
                email: matchedUser.email,
                photo: matchedUser.photo || '/static/assets/default-avatar.png'
            })
        });

        if (!addResponse.ok) {
            const errorData = await addResponse.json().catch(() => ({}));
            showMessagePopup(errorData.message || "Failed to add friend. Please try again.");
            return;
        }
         // Create notification for successful friend addition
        await handleNotification(`👥 Added ${matchedUser.username} as a friend!`, 'Friend alert');

        showMessagePopup("Friend added successfully!");
        await updateFriendList();
        hidePopup();

    } catch (error) {
        console.error('Error submitting form:', error);
        showMessagePopup("Something went wrong. Please try again.");
    }
}

async function handleNotification(message, category = 'Friend alert') {
    try {
        const response = await fetch('/api/notifications/create/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({
                message: message,
                category: category
            })
        });

        if (!response.ok) {
            console.error('Failed to create notification:', await response.text());
            return;
        }

        // Add the new notification to the list
        const notificationList = document.querySelector('.notification-list');
        const emptyMessage = notificationList.querySelector('.empty');
        if (emptyMessage) {
            emptyMessage.remove();
        }

        const newNotification = document.createElement('li');
        newNotification.className = 'new';
        newNotification.innerHTML = `
            <span class="notification-category">${category}</span>
            <span class="notification-message">${message}</span>
        `;
        notificationList.insertBefore(newNotification, notificationList.firstChild);

        // Show temporary notification
        showTemporaryNotification(message);

    } catch (error) {
        console.error('Error creating notification:', error);
    }
}

async function loadNotifications() {
    try {
        const response = await fetch('/api/notifications/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Failed to fetch notifications');
        }

        const notifications = await response.json();
        const notificationList = document.querySelector('.notification-list');
        notificationList.innerHTML = '';

        if (notifications.length === 0) {
            notificationList.innerHTML = '<li class="empty">No new notifications</li>';
            return;
        }

        notifications.forEach(notification => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="notification-category">${notification.category}</span>
                <span class="notification-message">${notification.message}</span>
            `;
            notificationList.appendChild(li);
        });

    } catch (error) {
        console.error('Error loading notifications:', error);
        const notificationList = document.querySelector('.notification-list');
        notificationList.innerHTML = '<li class="empty">Failed to load notifications</li>';
    }
}

// Helper function to get CSRF token from cookies
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

let friendIndexToDelete = null;
async function updateFriendList() {
    const listDiv = document.querySelector('.friend-list');
    listDiv.innerHTML = '<div class="loading">Loading friends...</div>';

    try {
        const response = await fetch('/api/friends/', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.status} ${response.statusText}`);
        }

        const friends = await response.json();
        console.log("Friends list response:", friends);

        // Clear loading message
        listDiv.innerHTML = '';

        // Make sure friends is an array
        const friendsList = Array.isArray(friends) ? friends : [];

        if (!friendsList.length) {
            listDiv.innerHTML = '<div class="no-friends">No friends available</div>';
            return;
        }

        friendsList.forEach((friend) => {
            const container = document.createElement('li');
            // Matches: .friends-list li
            container.style.display = 'flex';
            container.style.alignItems = 'center';
            container.style.padding = '8px';
            container.style.borderBottom = '1px solid var(--form-bg-color)';

            const img = document.createElement('img');
            img.src = friend.photo || '/static/assets/blue.avif';
            img.alt = "Friend Avatar";
            img.style.width = '40px';
            img.style.height = '40px';
            img.style.borderRadius = '50%';
            img.style.marginRight = '10px';

            const infoDiv = document.createElement('div');
            infoDiv.style.flex = '1';

            const nameSpan = document.createElement('span');
            nameSpan.textContent = friend.name;
            nameSpan.style.fontWeight = 'bold';
            nameSpan.style.display = 'block';
            nameSpan.style.color = 'var(--text-color)';
            nameSpan.style.fontSize = '14px';

            const emailSpan = document.createElement('span');
            emailSpan.textContent = friend.email;
            emailSpan.style.display = 'block';
            emailSpan.style.color = 'var(--text-secondary)';
            emailSpan.style.fontSize = '14px';

            infoDiv.appendChild(nameSpan);
            infoDiv.appendChild(emailSpan);

            const statusSpan = document.createElement('span');
            const isOnline = friend.status === 'Online';
            statusSpan.textContent = friend.status || 'Online';
            statusSpan.style.color = isOnline ? 'green' : 'var(--text-secondary)';
            statusSpan.style.marginRight = '10px';
            statusSpan.style.fontSize = '14px';
            statusSpan.style.display = 'none';

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Remove';
            deleteBtn.classList.add('delete-friend');

            deleteBtn.addEventListener('click', () => {
                friendIdToDelete = friend.id;
                const friendLabel = friend.name;
                document.getElementById('confirm-text').textContent =
                    `Are you sure you want to remove "${friendLabel}" from your friends list?`;
                document.getElementById('confirm-modal').classList.remove('hidden');
            });

            container.appendChild(img);
            container.appendChild(infoDiv);
            container.appendChild(statusSpan);
            container.appendChild(deleteBtn);

            listDiv.appendChild(container);
        });

    } catch (err) {
        console.error("Failed to load friends list", err);
        listDiv.innerHTML = '<div class="error">Failed to load friends list. Please refresh the page.</div>';
        showMessagePopup("Failed to load friends list.");
    }
}

// Add a debug function to check API responses
function debugAPIResponse(apiName, response) {
    console.log(`${apiName} Response:`, response);
}


updateFriendList();


document.getElementById('confirm-yes').addEventListener('click', async () => {
    if (friendIdToDelete !== null) {
        try {
            // Get CSRF token from cookie
            const csrftoken = getCookie('csrftoken');

            await fetch(`/api/friends/${friendIdToDelete}/`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken
                },
                credentials: 'include'
            });

            updateFriendList(); // Refresh the list after deletion
        } catch (error) {
            console.error("Error deleting friend:", error);
            showMessagePopup("Failed to delete friend.");
        } finally {
            friendIdToDelete = null;
            document.getElementById('confirm-modal').classList.add('hidden');
        }
    }
});

document.getElementById('confirm-no').addEventListener('click', () => {
    friendIdToDelete = null;
    document.getElementById('confirm-modal').classList.add('hidden');
});
let currentUserFavorites = []; // Array to store IDs of books the current user has favorited
let currentUserBorrowedBooks = [];

function addBookToDisplay(book) {
    const bookItem = document.createElement('div');
    bookItem.className = 'book-card';
    bookItem.id = `book_${book.book_id}`;

    const isFavorite = currentUserFavorites.includes(book.book_id);
    const starClass = isFavorite ? 'active' : '';

    bookItem.innerHTML = `
        <button class="star-button ${starClass}" data-book-id="${book.book_id}">
            <i class="fas fa-star"></i>
        </button>
        ${book.cover_image_url ?
            `<img src="${book.cover_image_url}" alt="${book.title} book cover">` :
            `<i class="fas fa-book-open"></i>`
        }
        <div class="book-info">
            <h3>${book.title}</h3>
            <p>By ${book.author_name}</p>
            <p>${book.genre_name || 'Unknown'}</p>
        </div>
    `;
    return bookItem;
}


document.addEventListener('DOMContentLoaded', async function () {
    // Add custom notification styles if they don't exist
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
                /* Animation defined in showNotification function */
            }

            @keyframes slide-in {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }

            @keyframes fade-out {
                from { opacity: 1; }
                to { opacity: 0; }
            }
             /* Style for disabled borrow button */
            .book-btn.borrow-btn:disabled {
                background-color: #ccc; /* Grey out */
                cursor: not-allowed;
                opacity: 0.7;
            }
             .book-btn.borrow-btn:disabled:hover {
                background-color: #ccc; /* Keep grey on hover */
                box-shadow: none;
             }

             /* Optional: Styles for availability badges */
             .availability-badge.available {
                 background-color: #4CAF50; /* Green */
             }
             .availability-badge.unavailable {
                 background-color: #F44336; /* Red */
             }
              .availability-badge {
                 display: inline-block;
                 padding: 4px 8px;
                 border-radius: 4px;
                 color: white;
                 font-size: 0.8em;
                 margin-right: 5px;
                 margin-bottom: 5px; /* Add margin for better spacing with other indicators */
             }
             .format-indicator {
                 display: inline-block;
                 padding: 2px 6px;
                 border: 1px solid #ccc;
                 border-radius: 4px;
                 font-size: 0.7em;
                 margin-right: 5px;
                 margin-bottom: 5px;
             }
              .copies-count {
                display: inline-block;
                padding: 2px 6px;
                border: 1px solid #ccc;
                border-radius: 4px;
                font-size: 0.7em;
                margin-right: 5px;
                margin-bottom: 5px;
            }
             .availability {
                margin-top: 10px; /* Space above availability info */
             }
             .book-details p {
                 margin-bottom: 5px; /* Space below author */
             }
             .book-details h3 {
                 margin-bottom: 5px; /* Space below title */
             }
             /* Style for the Low Stock badge, which we will now also use for "Digital Available" */
             .availability-badge.low-stock {
                 background-color: #f39c12; /* Orange */
                 color: white;
             }

        `;

        document.head.appendChild(notificationStyles);
        loadNotifications();
    }


    const bookGrid = document.querySelectorAll('.book-grid');
    // Clear loading message or initial content

    // --- Fetch User's Favorite Book IDs ---
    // This should ideally happen only if the user is authenticated.
    // Assuming your Django views handle authentication and return 401 if not logged in.
    try {
    const response = await fetch('/api/user/favorites/');
    if (response.ok) {
        const favorites = await response.json();
        currentUserFavorites = favorites.map(fav => fav.book_id);
    } else {
        console.warn('Could not fetch user favorites. User might not be logged in or an error occurred.');
    }
    } catch (error) {
        console.error('Error fetching user favorites:', error);
    }

    try {
        const response = await fetch('/api/borrowings/current/');
        if (response.ok) {
            const borrowings = await response.json();
            currentUserBorrowedBooks = borrowings.map(b => b.book_id);
        } else {
            console.warn('Could not fetch current borrowings. User might not be logged in or an error occurred.');
        }
    } catch (error) {
        console.error('Error fetching borrowed books:', error);
    }


    // --- Fetch Books and Display ---
async function fetchAndDisplayFavouriteBooks(params = new URLSearchParams()) {
    bookGrid[0].innerHTML = '<div class="loading-message">Loading books...</div>'; // Show loading message

    try {
        const response = await fetch(`/api/books/?${params.toString()}`);
        if (!response.ok) {
            throw new Error('Failed to fetch books');
        }
        const books = await response.json();

        bookGrid[0].innerHTML = ''; // Clear loading message and previous books

        // ✅ Filter books to only include favorites
        const favoriteBooks = books.filter(book => currentUserFavorites.includes(book.book_id));

        if (favoriteBooks.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'no-results';
            noResults.textContent = 'You have not favorited any books yet.';
            bookGrid[0].appendChild(noResults);
        } else {
            // ✅ Limit to the first 4 favorite books
            favoriteBooks.slice(0, 4).forEach(book => {
                const bookItem = addBookToDisplay(book);
                bookGrid[0].appendChild(bookItem);
            });
        }

    } catch (error) {
        console.error('Error fetching books:', error);
        bookGrid[0].innerHTML = '<div class="error-message">Failed to load books. Please try again later.</div>';
        showNotification("❌ Failed to load books");
    }
}
async function fetchAndDisplayBorrowedBooks(params = new URLSearchParams()) {
    bookGrid[1].innerHTML = '<div class="loading-message">Loading books...</div>'; // Show loading message

    try {
        const response = await fetch(`/api/books/?${params.toString()}`);
        if (!response.ok) {
            throw new Error('Failed to fetch borrowed books');
        }

        const books = await response.json();
        const borrowedBooks = books.filter(book => currentUserBorrowedBooks.includes(book.book_id));
        bookGrid[1].innerHTML = ''; // Clear loading message

        if (borrowedBooks.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'no-results';
            noResults.textContent = 'You have not borrowed any books.';
            bookGrid[1].appendChild(noResults);
        } else {
            borrowedBooks.slice(0, 4).forEach(book => {
                const bookItem = addBookToDisplay(book);
                bookGrid[1].appendChild(bookItem);
            });
        }

    } catch (error) {
        console.error('Error fetching borrowed books:', error);
        bookGrid[1].innerHTML = '<div class="error-message">Failed to load borrowed books. Please try again later.</div>';
        showNotification("❌ Failed to load borrowed books");
    }
}



    // Initial fetch and display of books
    fetchAndDisplayFavouriteBooks();
    fetchAndDisplayBorrowedBooks();

});