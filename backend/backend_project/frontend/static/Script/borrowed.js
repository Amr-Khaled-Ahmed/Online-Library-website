// Helper function to get CSRF token (same as in books.js)
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

// Function to show notifications (same as in books.js)
function showNotification(message) {
    const notif = document.createElement('div');
    notif.className = 'custom-notification';
    notif.textContent = message;
    document.body.appendChild(notif);
    // Add animation classes
    notif.style.animation = 'slide-in 0.5s forwards, fade-out 0.5s 2.5s forwards';

    // Remove the notification after the animation ends
    setTimeout(() => {
        notif.remove();
    }, 3000); // Matches total animation duration (0.5s slide-in + 2.5s display + 0.5s fade-out)
}

// Helper function to format dates in a user-friendly way
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    // Append 'Z' if timezone info is missing to indicate UTC
    const date = new Date(dateString.endsWith('Z') ? dateString : dateString + 'Z');
    if (isNaN(date.getTime())) return 'Invalid Date';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Function to refresh both current borrows and history lists
function refreshBorrowedPageLists() {
    console.log('Refreshing borrowed page lists...');
    // Call the functions that re-fetch and render the current borrows and history lists
    renderCurrentBorrows();
    renderBorrowingHistory();
    // You might also want to re-render favorites too if actions here affect its display (e.g., availability)
    // renderFavorites(); // Uncomment this if needed
}


// Function to render current borrowed books (fetches from backend)
// Modified to display Renewals Left as remaining / max and include is_favorited status.
async function renderCurrentBorrows() {
    const container = document.getElementById('current-borrows');
    if (!container) return;

    container.innerHTML = '<div class="loading-message">Loading borrowed books...</div>'; // Show loading message

    try {
        // Call the backend endpoint to fetch current borrowings data
        const response = await fetch('/api/borrowings/current/');
        if (!response.ok) {
             // Handle cases where user is not logged in gracefully
            if (response.status === 401 || response.status === 403) { // Check 401 Unauthorized and 403 Forbidden
                 container.innerHTML = `
                     <div class="empty-state">
                         <i class="fas fa-lock"></i>
                         <p>You must be logged in to view your borrowed books.</p>
                         <p><a href="/sign-in">Sign in</a> or <a href="/sign-up">Sign up</a></p>
                     </div>
                 `;
                 return; // Stop execution if not authenticated
            }
            // Handle other API errors
            const errorData = await response.json();
            throw new Error(errorData.error || `Failed to fetch current borrowings: ${response.status}`);
        }
        const borrowedBooks = await response.json(); // This is the array of current borrowing objects

        container.innerHTML = ''; // Clear loading message or previous content

        if (borrowedBooks.length === 0) {
            // Display empty state message if no current borrowings
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-state'; // Use a general class for empty states
            emptyMessage.innerHTML = `
                <i class="fas fa-book"></i>
                <p>You don't have any borrowed books.</p>
                <p>Visit the <a href="/books">Books</a> page to borrow some!</p>
            `;
            container.appendChild(emptyMessage);
        } else {
             // Iterate through the fetched current borrowing records
             borrowedBooks.forEach(borrowing => {
                 // Use the date strings directly from the backend as they are ISO format
                 const borrowDate = borrowing.borrow_date;
                 const dueDate = borrowing.due_date;

                 // Calculate status based on the due_date string
                 const today = new Date();
                 // Convert backend ISO date strings to Date objects for comparison
                 const dueDateObj = new Date(dueDate.endsWith('Z') ? dueDate : dueDate + 'Z'); // Ensure timezone awareness if not already
                 // Use start of day for accurate date-only comparison
                 const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                 const dueDateStart = new Date(dueDateObj.getFullYear(), dueDateObj.getMonth(), dueDateObj.getDate());

                 const diffTime = dueDateStart.getTime() - todayStart.getTime();
                 const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Calculate days left

                 let statusClass = 'on-time';
                 let statusText = 'Not due soon'; // Default text for on-time status

                 if (diffDays < 0) {
                     statusClass = 'overdue';
                     statusText = 'Overdue';
                 } else if (diffDays === 0) {
                     statusClass = 'due-today';
                     statusText = 'Due today';
                 } else if (diffDays === 1) {
                     statusClass = 'due-tomorrow';
                     statusText = 'Due tomorrow';
                 } else if (diffDays <= 3 && diffDays > 1) { // Due in 2 or 3 days
                     statusClass = 'due-soon';
                     statusText = `Due in ${diffDays} days`;
                 } else { // More than 3 days left
                     statusClass = 'on-time';
                      // You can customize the text for > 3 days if needed, e.g., 'On Time'
                     statusText = `Due in ${diffDays} days`; // Or just 'On Time'
                 }

                 // Calculate renewals remaining (as requested: max - used)
                 const renewalsRemaining = borrowing.max_renewal_count - borrowing.current_renew_count;


                 // Determine if renew button should be enabled using 'can_renew' boolean from backend
                 const canRenew = borrowing.can_renew;
                 const renewButtonDisabled = !canRenew ? 'disabled' : '';
                 let renewButtonText = 'Renew';
                 if (!canRenew) {
                      if (borrowing.current_renew_count >= borrowing.max_renewal_count) {
                           renewButtonText = 'Max Renewals';
                      } else if (borrowing.is_overdue) { // Check the is_overdue flag from backend
                           renewButtonText = 'Overdue';
                      } else {
                           renewButtonText = 'Cannot Renew'; // Generic disabled state
                      }
                 }

                 // Create the div element for this borrowed item
                 const borrowedItem = document.createElement('div');
                 borrowedItem.className = 'borrowed-item';
                 borrowedItem.setAttribute('data-borrowing-id', borrowing.id); // Set borrowing ID for actions


                 // Check is_favorited from backend and add active class to star button
                 const isFavorite = borrowing.is_favorited; // Get the boolean flag from the backend data
                 const starClass = isFavorite ? 'active' : ''; // Add 'active' class if isFavorite is true


                 // Set the inner HTML of the borrowed item
                 borrowedItem.innerHTML = `
                     <div class="borrowed-cover">
                         ${borrowing.book_cover_path ?
                             `<img src="${borrowing.book_cover_path}" alt="${borrowing.book_title} cover">` :
                             `<i class="fas fa-book-open"></i>`}
                     </div>
                     <div class="borrowed-details">
                         <button class="star-button ${starClass}" data-book-id="${borrowing.book_id}"><i class="fas fa-star"></i></button> 
                         <h3 class="borrowed-title">${borrowing.book_title}</h3>
                         <p class="borrowed-author">By ${borrowing.book_author}</p>

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
                                 <span class="info-value">${renewalsRemaining}/${borrowing.max_renewal_count}</span>
                             </div>
                             <div class="info-item">
                                 <span class="info-label">Format</span>
                                 <span class="info-value">${borrowing.format || 'Unknown'}</span>
                             </div>
                         </div>

                         <span class="status-badge ${statusClass}">${statusText}</span>

                         <div class="action-buttons">
                             <button class="renew-btn" data-borrowing-id="${borrowing.id}" ${renewButtonDisabled}>${renewButtonText}</button>
                             <button class="return-btn" data-borrowing-id="${borrowing.id}">Return</button>
                         </div>
                     </div>
                 `;

                 // Append the new item to the container
                 container.appendChild(borrowedItem);
             });

             // After rendering the list, setup functionality for the newly added elements
             setupModalFunctionality(); // Setup modal trigger for list items
             setupStarButtons(); // Setup click listeners for star buttons (using delegation within this function)
             // Note: Renew/Return button listeners are handled by event delegation on the container outside this render function.
        }

    } catch (error) {
        console.error('Error fetching current borrowings:', error);
         container.innerHTML = '<div class="error-message">Failed to load current borrowings. Please try again later.</div>'; // Display error message to the user
        showNotification("❌ Failed to load current borrowings"); // Show notification error
    }
}


// Function to render borrowing history (fetches from backend)
// Modified to include is_favorited status.
async function renderBorrowingHistory() {
    const container = document.getElementById('borrowing-history');
    if (!container) return;

    container.innerHTML = '<div class="loading-message">Loading borrowing history...</div>'; // Show loading message

    try {
        // Call the backend endpoint to fetch borrowing history data
        const response = await fetch('/api/borrowings/history/');
        if (!response.ok) {
             // Handle cases where user is not logged in gracefully
            if (response.status === 401 || response.status === 403) {
                 container.innerHTML = `
                     <div class="empty-state">
                         <i class="fas fa-lock"></i>
                         <p>You must be logged in to view your borrowing history.</p>
                         <p><a href="/sign-in">Sign in</a> or <a href="/sign-up">Sign up</a></p>
                     </div>
                 `;
                 return; // Stop execution
            }
             // Handle other API errors
             const errorData = await response.json();
            throw new Error(errorData.error || `Failed to fetch borrowing history: ${response.status}`);
        }
        const borrowingHistory = await response.json(); // This is the array of history objects

        container.innerHTML = ''; // Clear loading message or previous content

        if (borrowingHistory.length === 0) {
            // Display empty state message
            const emptyMessage = document.createElement('div');
             emptyMessage.className = 'empty-state';
            emptyMessage.innerHTML = `
                <i class="fas fa-history"></i>
                <p>You don't have any borrowing history yet.</p>
                <p>Returned books will appear here.</p>
            `;
            container.appendChild(emptyMessage);
        } else {
            // Iterate through the fetched history records
            borrowingHistory.forEach(history => {
                // Use the date strings directly from backend data
                const borrowDate = history.borrow_date;
                const dueDate = history.due_date; // This is the final due date before return
                const returnDate = history.return_date;


                // Get calculated status details from backend
                const isLate = history.returned_late; // Boolean
                const fineAmount = history.fine_amount; // Number

                // Check if the book was renewed at least once
                const was_renewed = history.renewed; // Boolean


                // Create the div element for this history item
                const borrowedItem = document.createElement('div'); // Use the same class for consistent styling/modal
                borrowedItem.className = 'borrowed-item'; // Keep the class name for styling and modal functionality


                 // Check is_favorited from backend and add active class to star button
                 const isFavorite = history.is_favorited; // Get the boolean flag from the backend data
                 const starClass = isFavorite ? 'active' : ''; // Add 'active' class if isFavorite is true


                // Set the inner HTML structure for the history item
                let itemHTML = `
                    <div class="borrowed-cover">
                        ${history.book_cover_path ?
                            `<img src="${history.book_cover_path}" alt="${history.book_title} cover">` :
                            `<i class="fas fa-book-open"></i>`}
                    </div>
                    <div class="borrowed-details">
                         <button class="star-button ${starClass}" data-book-id="${history.book_id}"><i class="fas fa-star"></i></button> 
                        <h3 class="borrowed-title">${history.book_title}</h3>
                        <p class="borrowed-author">By ${history.book_author}</p>

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

                // Add renewal info row only if the book was renewed
                if (was_renewed) {
                    const renewedDate = history.last_renewal_date; // Use the actual renewal date string from backend
                    const renewalsUsedHistory = history.current_renew_count; // Get the count of renewals used

                    itemHTML += `
                            <div class="info-item">
                                <span class="info-label">Renewed (${renewalsUsedHistory})</span> 
                                <span class="info-value">${formatDate(renewedDate)}</span>
                            </div>`;
                }

                // Add format row and close the borrowed-info div
                itemHTML += `
                        <div class="info-item">
                            <span class="info-label">Format</span>
                            <span class="info-value">${history.format || 'Unknown'}</span>
                        </div>
                    </div>
                    `; // Close borrowed-info div here

                // Add status badge and fine indicator if applicable, then close borrowed-details div
                itemHTML += `
                    <span class="status-badge ${isLate ? 'late-return' : 'returned'}">${isLate ? 'Returned Late' : 'Returned'}</span>
                     ${isLate && fineAmount > 0 ? `<span class="fine-indicator">Fine: $${fineAmount.toFixed(2)}</span>` : ''}
                </div>
            `; // Close borrowed-details div here

                borrowedItem.innerHTML = itemHTML; // Set the inner HTML of the item
                container.appendChild(borrowedItem); // Append the new item to the container
            });

            // Set up event handlers for the newly added elements
            setupStarButtons(); // Re-setup star button listeners for history items
            setupModalFunctionality(); // Setup modal trigger for history items
             // No renew/return buttons in history, so no need for event delegation on container for those
        }


    } catch (error) {
        console.error('Error fetching borrowing history:', error);
        container.innerHTML = '<div class="error-message">Failed to load borrowing history. Please try again later.</div>'; // Display error message
        showNotification("❌ Failed to load borrowing history"); // Show notification error
    }
}


// Function to render the favorite books (fetches from backend)
// Remains the same as provided previously.
async function renderFavorites() {
    const container = document.getElementById('favorites');
    if (!container) return;

    container.innerHTML = '<div class="loading-message">Loading favorites...</div>'; // Show loading message

    try {
        // Call the backend endpoint to fetch user's favorites data
        const response = await fetch('/api/user/favorites/');
        if (!response.ok) {
             // Handle cases where user is not logged in gracefully
            if (response.status === 401 || response.status === 403) {
                 container.innerHTML = `
                     <div class="empty-state">
                         <i class="fas fa-lock"></i>
                         <p>You must be logged in to view your favorites.</p>
                         <p><a href="/sign-in">Sign in</a> or <a href="/sign-up">Sign up</a></p>
                     </div>
                 `;
                 return; // Stop execution
            }
             // Handle other API errors
             const errorData = await response.json();
            throw new Error(errorData.error || `Failed to fetch favorites: ${response.status}`);
        }
        const favorites = await response.json(); // This is the array of favorite book objects

        container.innerHTML = ''; // Clear loading message or previous content

        if (favorites.length === 0) {
            // Display empty state message
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-state';
            emptyMessage.innerHTML = `
                <i class="fas fa-star"></i>
                <p>You don't have any favorite books yet.</p>
                <p>Click the star icon on any book on the <a href="/books">Books</a> page to add it to your favorites.</p>
            `;
            container.appendChild(emptyMessage);
        } else {
            // Iterate through the fetched favorite book objects
            favorites.forEach(favorite => { // 'favorite' object contains book details fetched from backend
                const item = document.createElement('div');
                item.classList.add('favorite-item'); // Use a specific class for favorite items

                 // Determine if the favorite book is currently available for borrowing
                 const canBorrowFavorite = favorite.is_available; // Use availability flag from backend
                 const borrowFavoriteButtonText = canBorrowFavorite ? 'Borrow' : 'Not Available';
                 const borrowFavoriteButtonDisabled = !canBorrowFavorite ? 'disabled' : '';


                // Set the inner HTML using data from the favorite object
                item.innerHTML = `
                    <div class="favorite-cover">
                        ${favorite.cover_path ?
                            `<img src="${favorite.cover_path}" alt="${favorite.title} cover">` :
                            `<i class="fas fa-book-open"></i>`}
                    </div>
                    <div class="favorite-details">
                        <button class="star-button active" data-book-id="${favorite.book_id}"><i class="fas fa-star"></i></button> 
                        <h3 class="favorite-title">${favorite.title}</h3>
                        <p class="favorite-author">By ${favorite.author}</p>
                        <p class="favorite-description">${favorite.description ? favorite.description.substring(0, 150) + '...' : 'No description available.'}</p> 
                        <div class="action-buttons"> 
                             <button class="book-btn borrow-btn" data-book-id="${favorite.book_id}" ${borrowFavoriteButtonDisabled}>${borrowFavoriteButtonText}</button>
                             <button class="remove-favorite-btn" data-book-id="${favorite.book_id}">Remove</button>
                        </div>
                    </div>
                `;

                 // Add borrow button event listener for favorite items (using event delegation on container is also an option)
                const borrowBtn = item.querySelector('.borrow-btn');
                if (borrowBtn && !borrowBtn.disabled) { // Check if button exists and is not disabled
                     borrowBtn.addEventListener('click', async () => {
                         const bookIdToBorrow = borrowBtn.getAttribute('data-book-id');
                         if (!bookIdToBorrow) {
                             console.error('Borrow button is missing data-book-id on favorite item');
                             showNotification("❌ Error: Could not borrow book.");
                             return;
                         }
                          // Borrow logic (similar to books.js)
                          try {
                              // Disable the button immediately to prevent multiple clicks
                              borrowBtn.disabled = true;
                              borrowBtn.classList.add('disabled');
                              borrowBtn.textContent = 'Processing...';

                              const response = await fetch(`/api/books/${bookIdToBorrow}/borrow/`, {
                                  method: 'POST',
                                  headers: {
                                      'X-CSRFToken': getCookie('csrftoken') // Include CSRF token
                                  }
                              });

                              const data = await response.json();

                              if (!response.ok) {
                                   // Re-enable button and revert text on failure
                                   borrowBtn.disabled = false;
                                   borrowBtn.classList.remove('disabled');
                                   borrowBtn.textContent = borrowFavoriteButtonText; // Revert to original text

                                  showNotification(`❌ ${data.error || 'Failed to borrow book'}`);
                                  console.error('Error:', data.error);
                              } else {
                                  showNotification("✅ Book borrowed successfully!");
                                   // After successful borrow, the book is no longer available
                                   // We should reflect this in the UI.
                                   borrowBtn.textContent = 'Borrowed'; // Change text
                                   borrowBtn.disabled = true; // Keep disabled


                                   // Call the refresh function to update relevant lists
                                   // Borrowing affects current borrows and history.
                                   // It also affects availability shown in the favorites list, so re-render favorites too.
                                   refreshBorrowedPageLists(); // Updates current borrows and history
                                   renderFavorites(); // Explicitly re-render favorites list

                              }
                          } catch (error) {
                               // Re-enable button and revert text on fetch error
                                borrowBtn.disabled = false;
                                borrowBtn.classList.remove('disabled');
                                borrowBtn.textContent = borrowFavoriteButtonText; // Revert to original text

                               showNotification(`❌ An error occurred: ${error.message || 'Failed to borrow book'}`);
                               console.error('Fetch Error:', error);
                          }
                     });
                }


                // Add event listener for the remove favorite button
                const removeBtn = item.querySelector('.remove-favorite-btn');
                if (removeBtn) { // Check if button exists
                     removeBtn.addEventListener('click', async () => {
                          const bookIdToRemove = removeBtn.getAttribute('data-book-id');
                          if (!bookIdToRemove) {
                               console.error('Remove favorite button is missing data-book-id');
                               showNotification("❌ Error: Could not remove favorite.");
                               return;
                          }
                          try {
                              // Call the backend endpoint to toggle favorite status
                              const response = await fetch(`/api/books/${bookIdToRemove}/favorite/`, { // Use the add_remove_favorite endpoint
                                  method: 'POST', // POST to toggle favorite status
                                  headers: {
                                      'X-CSRFToken': getCookie('csrftoken') // Include CSRF token
                                  }
                              });

                              const data = await response.json();

                              if (!response.ok) {
                                  showNotification(`❌ ${data.error || 'Failed to remove favorite'}`);
                                  console.error('Error:', data.error);
                              } else {
                                   // Assuming the response indicates successful removal (data.favorited === false)
                                   if (!data.favorited) {
                                        item.remove(); // Remove the item from the UI visually

                                        // Show notification
                                        showNotification("🗑️ Book removed from favorites!");

                                        // Check if there are still favorite items and display empty message if needed
                                        const remainingFavorites = container.querySelectorAll('.favorite-item');
                                        if (remainingFavorites.length === 0) {
                                             const emptyMessage = document.createElement('div');
                                              emptyMessage.className = 'empty-state';
                                              emptyMessage.innerHTML = `
                                                  <i class="fas fa-star"></i>
                                                  <p>You don't have any favorite books yet.</p>
                                                  <p>Click the star icon on any book on the <a href="/books">Books</a> page to add it to your favorites.</p>
                                              `;
                                              container.appendChild(emptyMessage);
                                        }

                                        // Re-render all lists on the borrowed page to update star icons everywhere
                                        refreshBorrowedPageLists();

                                        // Optional: Find and update the star button on the books page if it's loaded
                                        // This requires an element with ID `book_${bookId}` on the books page
                                        const booksPageStarButton = document.querySelector(`#book_${bookIdToRemove} .star-button`);
                                        if(booksPageStarButton) {
                                            booksPageStarButton.classList.remove('active'); // Remove active class if exists
                                        }
                                   } else {
                                        // This case should ideally not happen when clicking "Remove", but handle defensively
                                        showNotification("Book is still in favorites.");
                                   }
                              }
                          } catch (error) {
                              showNotification(`❌ An error occurred: ${error.message || 'Failed to remove favorite'}`);
                              console.error('Fetch Error:', error);
                          }
                     });
                }

                container.appendChild(item); // Append the new item to the container
            });

            // Re-setup star button functionality for the newly added favorite items
            setupStarButtons(); // Needed to make stars clickable again in favorites list (though favorites stars should always be active)
            // Modal should also work for favorite items
            setupModalFunctionality();
        }


    } catch (error) {
        console.error('Error fetching favorites:', error);
        container.innerHTML = '<div class="error-message">Failed to load favorites. Please try again later.</div>'; // Display error message
        showNotification("❌ Failed to load favorites"); // Show notification error
    }
}


// The setupStarButtons function handles adding/removing the 'active' class on click.
// It is called after each list rendering function.
function setupStarButtons() {
    // Use event delegation on the main content area or specific list containers if preferred
    // For simplicity, re-attaching listeners to all '.star-button' elements after rendering.
    // Clone node is used to remove previous listeners safely before adding new ones.
    document.querySelectorAll('.star-button').forEach(button => {
        // Create a new element to replace the old one, effectively removing old listeners
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);

        newButton.addEventListener('click', async (event) => {
            event.stopPropagation(); // Prevent potential clicks on parent elements (like modal trigger)
            const bookId = newButton.getAttribute('data-book-id'); // Get book ID from data attribute
            if (!bookId) {
                console.error('Star button is missing data-book-id');
                showNotification("❌ Error: Could not update favorite status.");
                return;
            }

            try {
                // Call the backend endpoint to toggle favorite status
                const response = await fetch(`/api/books/${bookId}/favorite/`, {
                    method: 'POST', // Use POST request for toggling state
                    headers: {
                        'X-CSRFToken': getCookie('csrftoken') // Include CSRF token
                    }
                });

                const data = await response.json(); // Backend returns { favorited: true/false }

                if (!response.ok) {
                     // Handle errors (e.g., user not logged in)
                    if (response.status === 401 || response.status === 403) {
                         showNotification("❌ You must be logged in to favorite books.");
                    } else {
                         showNotification(`❌ ${data.error || 'Failed to update favorites'}`);
                         console.error('Error:', data.error);
                    }
                } else {
                    // Update the UI based on the backend response
                    if (data.favorited) {
                        newButton.classList.add('active'); // Add 'active' class to fill the star
                        showNotification("⭐ Added to favorites!");
                    } else {
                        newButton.classList.remove('active'); // Remove 'active' class to unfill the star
                        showNotification("⭐ Removed from favorites!");
                    }
                    // Re-render all lists on the borrowed page to ensure star icons are consistent everywhere
                    refreshBorrowedPageLists();
                    // If currently viewing the favorites tab, re-render it explicitly as its content changes
                    if (document.getElementById("tab3").checked) {
                         renderFavorites();
                     }
                     // Optional: Find and update the star button on the books page if it's loaded
                     const booksPageStarButton = document.querySelector(`#book_${bookId} .star-button`);
                     if(booksPageStarButton) {
                         if (data.favorited) {
                              booksPageStarButton.classList.add('active');
                         } else {
                              booksPageStarButton.classList.remove('active');
                         }
                     }
                }
            } catch (error) {
                // Handle fetch errors
                showNotification(`❌ An error occurred: ${error.message || 'Failed to update favorites'}`);
                console.error('Fetch Error:', error);
            }
        });
    });
}


// Helper function to update the status badge text and class
function updateStatusBadge(borrowedItem, dueDateString) {
    const statusBadge = borrowedItem.querySelector('.status-badge');
    if (!statusBadge || !dueDateString) return; // Exit if badge or date is missing

    const today = new Date();
    // Convert the backend ISO date string to a Date object
    const dueDate = new Date(dueDateString.endsWith('Z') ? dueDateString : dueDateString + 'Z');


    // Calculate days left comparing just the dates (ignore time)
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const dueDateMidnight = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

    const diffTime = dueDateMidnight.getTime() - todayMidnight.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Remove existing status classes before adding the correct one
    statusBadge.classList.remove('overdue', 'due-tomorrow', 'due-soon', 'on-time', 'due-today', 'late-return', 'returned'); // Include all possible status classes

    if (diffDays < 0) {
        statusBadge.classList.add('overdue');
        statusBadge.textContent = 'Overdue';
    } else if (diffDays === 0) {
         statusBadge.classList.add('due-today');
         statusBadge.textContent = 'Due today';
    } else if (diffDays === 1) {
        statusBadge.classList.add('due-tomorrow');
        statusBadge.textContent = 'Due tomorrow';
    } else if (diffDays <= 3 && diffDays > 1) { // Due in 2 or 3 days
        statusBadge.classList.add('due-soon');
        statusBadge.textContent = `Due in ${diffDays} days`;
    } else { // More than 3 days left
        statusBadge.classList.add('on-time');
        statusBadge.textContent = `Due in ${diffDays} days`; // Or customize text
    }
    // Note: 'returned' and 'late-return' statuses are typically set during the renderBorrowingHistory function, not by this updateStatusBadge helper.
}


// Set up modal functionality for dynamically created items
function setupModalFunctionality() {
    // This function sets up event delegation on the list containers
    // to show a modal with details when a list item (but not a button) is clicked.
    // The modal content is populated based on the clicked item's details.

    const borrowedModal = document.getElementById('borrowed-modal');
    if (!borrowedModal) {
        console.warn("Modal element with ID 'borrowed-modal' not found.");
        return; // Exit if modal not found
    }

    // Ensure modal close button listener is set up only once on DOMContentLoaded
    // The listeners for the modal overlay and close button are handled in the DOMContentLoaded block below.


    // Event delegation for modal on borrowed items container (#current-borrows)
    const borrowedListContainer = document.getElementById('current-borrows');
    if (borrowedListContainer) {
        // Add the click listener using event delegation
        borrowedListContainer.addEventListener('click', function(event) {
             // Check if the clicked element or its parent is a borrowed-item, but NOT a button inside it
             const clickedItem = event.target.closest('.borrowed-item');
             const clickedButton = event.target.closest('button'); // Check if a button was clicked within the item


             if (clickedItem && !clickedButton) { // If an item was clicked and it wasn't a button inside it
                // Get book details and borrowing info from the clicked item's content
                const title = clickedItem.querySelector('.borrowed-title')?.textContent || 'N/A';
                const author = clickedItem.querySelector('.borrowed-author')?.textContent.replace(/^By\s*/, '') || 'N/A'; // Remove "By " prefix
                const cover = clickedItem.querySelector('.borrowed-cover img')?.src || '';
                // Description is not typically shown in borrowed item view, but keeping the modal field
                const description = 'No detailed description available for borrowed items in this view.'; // Default message


                 // Find info items to extract specific details
                const infoItems = clickedItem.querySelectorAll('.borrowed-info .info-item');
                let borrowedDate = 'N/A';
                let dueDate = 'N/A';
                let renewalsInfoValue = 'N/A'; // Capture the exact text content of Renewals Left (e.g., "0/2" or "1/2")
                let format = 'N/A';
                 // Status text is from the status badge
                let statusText = clickedItem.querySelector('.status-badge')?.textContent || 'N/A';


                infoItems.forEach(infoItem => {
                    const label = infoItem.querySelector('.info-label')?.textContent.trim();
                    const value = infoItem.querySelector('.info-value')?.textContent.trim();

                    if (label === 'Borrowed On') borrowedDate = value;
                    else if (label === 'Due Date') dueDate = value;
                    else if (label === 'Renewals Left') renewalsInfoValue = value; // Capture the exact text content
                    else if (label === 'Format') format = value;
                });


                 // --- Set modal content for CURRENT BORROWS ---
                 document.getElementById('modal-title').textContent = title;
                 document.getElementById('modal-author').textContent = `By ${author}`;
                 document.getElementById('modal-image').src = cover;
                 document.getElementById('modal-image').alt = `${title} cover`;
                 // Hide description for borrowed/history items
                 const modalDescriptionElement = document.getElementById('modal-description');
                 if(modalDescriptionElement) modalDescriptionElement.style.display = 'none'; // Hide description section for borrowed/history


                 // Get the detail items in the modal to show/hide and populate
                 const modalBorrowedDateItem = document.getElementById('modal-borrowed-date')?.closest('.detail-item');
                 const modalDueDateItem = document.getElementById('modal-due-date')?.closest('.detail-item');
                 const modalStatusItem = document.getElementById('modal-status')?.closest('.detail-item');
                 const modalFormatItem = document.getElementById('modal-format')?.closest('.detail-item');
                 const modalRenewalsItem = document.getElementById('modal-renewals-item'); // Use the ID for the whole renewals detail item
                 const modalReturnedDateItem = document.getElementById('modal-returned-date-item'); // Use the ID for the returned date detail item
                 const modalFineItem = document.getElementById('modal-fine-item'); // Use the ID for the fine detail item


                 // Show items relevant to Current Borrows
                 if (modalBorrowedDateItem) modalBorrowedDateItem.style.display = 'flex';
                 if (modalDueDateItem) modalDueDateItem.style.display = 'flex';
                 if (modalStatusItem) modalStatusItem.style.display = 'flex';
                 if (modalFormatItem) modalFormatItem.style.display = 'flex';
                 if (modalRenewalsItem) modalRenewalsItem.style.display = 'flex'; // Always show renewals info for current borrows
                 // Hide items not relevant to Current Borrows
                 if (modalReturnedDateItem) modalReturnedDateItem.style.display = 'none';
                 if (modalFineItem) modalFineItem.style.display = 'none';


                 // Populate content for visible items
                 if (document.getElementById('modal-borrowed-date')) document.getElementById('modal-borrowed-date').textContent = borrowedDate;
                 if (document.getElementById('modal-due-date')) document.getElementById('modal-due-date').textContent = dueDate;
                 if (document.getElementById('modal-status')) document.getElementById('modal-status').textContent = statusText;
                 if (document.getElementById('modal-format')) document.getElementById('modal-format').textContent = format;
                 // Populate renewals info - use the exact text content captured from the list item
                 if (document.getElementById('modal-renewals')) {
                      document.getElementById('modal-renewals').textContent = renewalsInfoValue;
                      // Also set the label correctly for the modal (it might be different from list label)
                      const modalRenewalsLabel = modalRenewalsItem?.querySelector('strong'); // Use optional chaining
                       if(modalRenewalsLabel) modalRenewalsLabel.textContent = 'Renewals:'; // Set the label text
                 }


                 // Show the modal by removing the 'hidden' class
                 borrowedModal.classList.remove('hidden');
             }
        });
    }


     // Event delegation for modal on history items container (#borrowing-history)
    const historyListContainer = document.getElementById('borrowing-history');
    if (historyListContainer) {
         // Add the click listener using event delegation
         historyListContainer.addEventListener('click', function(event) {
             const clickedItem = event.target.closest('.borrowed-item'); // History items use the same class for styling/modal

              // Prevent modal opening if a button inside is clicked (history items currently have no buttons)
             const clickedButton = event.target.closest('button');

             if (clickedItem && !clickedButton) { // If an item was clicked and it wasn't a button inside it
                 // Get book details and history info from the clicked item's content
                 const title = clickedItem.querySelector('.borrowed-title')?.textContent || 'N/A';
                 const author = clickedItem.querySelector('.borrowed-author')?.textContent.replace(/^By\s*/, '') || 'N/A'; // Remove "By " prefix
                 const cover = clickedItem.querySelector('.borrowed-cover img')?.src || '';
                  // Description not applicable for history modal from list item data
                 const description = 'No detailed description available for history items in this view.';

                  // Find info items to extract specific details
                 const infoItems = clickedItem.querySelectorAll('.borrowed-info .info-item');
                 let borrowedDate = 'N/A';
                 let dueDate = 'N/A';
                 let returnedDate = 'N/A';
                 let renewedInfoLabel = 'N/A'; // Capture label like "Renewed (X)"
                 let renewedInfoValue = 'N/A'; // Capture date value for renewed renewal
                 let format = 'N/A';
                 // Status text is from the status badge
                 let statusText = clickedItem.querySelector('.status-badge')?.textContent || 'N/A';
                  // Fine amount from the fine indicator span
                 let fineAmountText = clickedItem.querySelector('.fine-indicator')?.textContent.replace(/^Fine:\s*\$/, '') || 'N/A'; // Get fine amount text and remove prefix/symbol


                 infoItems.forEach(infoItem => {
                     const label = infoItem.querySelector('.info-label')?.textContent.trim();
                     const value = infoItem.querySelector('.info-value')?.textContent.trim();

                     if (label === 'Borrowed On') borrowedDate = value;
                     else if (label === 'Due Date') dueDate = value;
                     else if (label === 'Returned On') returnedDate = value;
                     // Capture both label and value for the 'Renewed (X): Date' format
                     else if (label && label.startsWith('Renewed')) { renewedInfoLabel = label; renewedInfoValue = value; }
                     else if (label === 'Format') format = value;
                 });

                 // --- Set modal content for BORROWING HISTORY ---
                 document.getElementById('modal-title').textContent = title;
                 document.getElementById('modal-author').textContent = `By ${author}`;
                 document.getElementById('modal-image').src = cover;
                 document.getElementById('modal-image').alt = `${title} cover`;
                 // Hide description for borrowed/history items
                 const modalDescriptionElement = document.getElementById('modal-description');
                 if(modalDescriptionElement) modalDescriptionElement.style.display = 'none';


                 // Get the detail items in the modal to show/hide and populate
                 const modalBorrowedDateItem = document.getElementById('modal-borrowed-date')?.closest('.detail-item');
                 const modalDueDateItem = document.getElementById('modal-due-date')?.closest('.detail-item');
                 const modalStatusItem = document.getElementById('modal-status')?.closest('.detail-item');
                 const modalFormatItem = document.getElementById('modal-format')?.closest('.detail-item');
                 const modalRenewalsItem = document.getElementById('modal-renewals-item');
                 const modalReturnedDateItem = document.getElementById('modal-returned-date-item');
                 const modalFineItem = document.getElementById('modal-fine-item');


                 // Show items relevant to Borrowing History
                 if (modalBorrowedDateItem) modalBorrowedDateItem.style.display = 'flex';
                 if (modalDueDateItem) modalDueDateItem.style.display = 'flex';
                 if (modalStatusItem) modalStatusItem.style.display = 'flex'; // Show status (Returned/Returned Late)
                 if (modalFormatItem) modalFormatItem.style.display = 'flex';
                 if (modalReturnedDateItem) modalReturnedDateItem.style.display = 'flex'; // Show returned date

                 // Show renewals in modal only if the book was renewed (based on captured label)
                 if (modalRenewalsItem) modalRenewalsItem.style.display = (renewedInfoLabel !== 'N/A' && renewedInfoLabel.startsWith('Renewed')) ? 'flex' : 'none';

                 // Show fine item only if a fine amount was captured from the list item
                 if (modalFineItem) modalFineItem.style.display = (fineAmountText !== 'N/A') ? 'flex' : 'none';


                 // Populate content for visible items
                 if (document.getElementById('modal-borrowed-date')) document.getElementById('modal-borrowed-date').textContent = borrowedDate;
                 if (document.getElementById('modal-due-date')) document.getElementById('modal-due-date').textContent = dueDate;
                 if (document.getElementById('modal-status')) document.getElementById('modal-status').textContent = statusText;
                 if (document.getElementById('modal-format')) document.getElementById('modal-format').textContent = format;
                 if (document.getElementById('modal-returned-date')) document.getElementById('modal-returned-date').textContent = returnedDate;

                 // Populate renewals info for the modal if displayed
                 if (modalRenewalsItem && modalRenewalsItem.style.display !== 'none') {
                      const modalRenewalsLabel = modalRenewalsItem.querySelector('strong');
                      const modalRenewalsValue = modalRenewalsItem.querySelector('span');
                      if(modalRenewalsLabel) modalRenewalsLabel.textContent = renewedInfoLabel + ':'; // Set label including count (e.g., "Renewed (1):")
                      if(modalRenewalsValue) modalRenewalsValue.textContent = renewedInfoValue; // Set the renewed date
                 }

                 // Populate fine amount for the modal if displayed
                 if (document.getElementById('modal-fine-amount') && modalFineItem.style.display !== 'none') {
                     document.getElementById('modal-fine-amount').textContent = `$${parseFloat(fineAmountText).toFixed(2)}`; // Format the captured text
                 }


                 // Show the modal
                 borrowedModal.classList.remove('hidden');
             }
         });
    }


    // Event delegation for modal on favorites items container (#favorites)
    const favoritesListContainer = document.getElementById('favorites');
    if (favoritesListContainer) {
         // Add the click listener using event delegation
         favoritesListContainer.addEventListener('click', function(event) {
             const clickedItem = event.target.closest('.favorite-item'); // Favorite items use this class

              // Prevent modal opening if a button inside is clicked
             const clickedButton = event.target.closest('button');


             if (clickedItem && !clickedButton) { // If an item was clicked and it wasn't a button inside it
                 // Get book details from the clicked item's content
                 const title = clickedItem.querySelector('.favorite-title')?.textContent || 'N/A';
                 const author = clickedItem.querySelector('.favorite-author')?.textContent.replace(/^By\s*/, '') || 'N/A';
                 const cover = clickedItem.querySelector('.favorite-cover img')?.src || '';
                 const description = clickedItem.querySelector('.favorite-description')?.textContent || 'No description available.';


                 // --- Set modal content for FAVORITES ---
                 document.getElementById('modal-title').textContent = title;
                 document.getElementById('modal-author').textContent = `By ${author}`;
                 document.getElementById('modal-image').src = cover;
                 document.getElementById('modal-image').alt = `${title} cover`;
                 // Show description for favorite items
                 const modalDescriptionElement = document.getElementById('modal-description');
                 if(modalDescriptionElement) {
                      modalDescriptionElement.textContent = description;
                      modalDescriptionElement.style.display = 'block'; // Show description section
                 }


                 // Get the detail items in the modal to show/hide
                 const modalBorrowedDateItem = document.getElementById('modal-borrowed-date')?.closest('.detail-item');
                 const modalDueDateItem = document.getElementById('modal-due-date')?.closest('.detail-item');
                 const modalStatusItem = document.getElementById('modal-status')?.closest('.detail-item');
                 const modalFormatItem = document.getElementById('modal-format')?.closest('.detail-item');
                 const modalRenewalsItem = document.getElementById('modal-renewals-item');
                 const modalReturnedDateItem = document.getElementById('modal-returned-date-item');
                 const modalFineItem = document.getElementById('modal-fine-item');

                 // Hide all detail items that are specific to borrowed/history as they are not available for favorites from list item
                 if (modalBorrowedDateItem) modalBorrowedDateItem.style.display = 'none';
                 if (modalDueDateItem) modalDueDateItem.style.display = 'none';
                 if (modalStatusItem) modalStatusItem.style.display = 'none';
                 if (modalFormatItem) modalFormatItem.style.display = 'none'; // Format might be relevant, but list item doesn't show it easily
                 if (modalRenewalsItem) modalRenewalsItem.style.display = 'none';
                 if (modalReturnedDateItem) modalReturnedDateItem.style.display = 'none';
                 if (modalFineItem) modalFineItem.style.display = 'none';


                 // No specific details to set for favorites other than title, author, cover, description in this modal view


                 // Show the modal
                 borrowedModal.classList.remove('hidden');
             }
         });
    }


    // Close modal if clicked outside (attached once on DOMContentLoaded)
    const modalOverlay = document.getElementById('borrowed-modal'); // Get the modal overlay element
    if (modalOverlay) {
         // Remove existing listener if it was added before (more complex with anonymous functions)
         // Assuming it's attached once globally in DOMContentLoaded.
         modalOverlay.addEventListener('click', (event) => {
             // Check if the click is directly on the modal background (the overlay)
             if (event.target === modalOverlay) {
                 borrowedModal.classList.add('hidden'); // Hide the modal
             }
         });
    }

     // Close modal if the close button is clicked (attached once on DOMContentLoaded)
     const closeBtn = borrowedModal?.querySelector('.close-btn'); // Use optional chaining in case modal or button not found
      if (closeBtn) {
          closeBtn.addEventListener('click', () => {
              borrowedModal.classList.add('hidden'); // Hide the modal
          });
      }
}


// Event delegation for Renew and Return buttons on the #current-borrows container
const currentBorrowsContainer = document.getElementById('current-borrows');
if (currentBorrowsContainer) {
    currentBorrowsContainer.addEventListener('click', async (event) => {
        const target = event.target;
        // Use .closest() to check if the clicked element or its parent is a renew or return button
        const renewButton = target.closest('.renew-btn');
        const returnButton = target.closest('.return-btn');

        if (renewButton && !renewButton.disabled) {
            event.preventDefault(); // Prevent default button action (e.g., form submission)

            const borrowingId = renewButton.getAttribute('data-borrowing-id');
            console.log('Renew button clicked. Borrowing ID:', borrowingId); // Debugging log


            if (!borrowingId) {
                 console.error('Renew button is missing data-borrowing-id'); // Debugging log
                 showNotification("❌ Error: Could not find borrowing ID for renewal.");
                 return; // Stop execution
             }

            try {
                // Disable button during processing to prevent multiple clicks
                 renewButton.disabled = true;
                 renewButton.classList.add('disabled');
                 const originalText = renewButton.textContent; // Store original text
                 renewButton.textContent = 'Renewing...'; // Change button text to indicate processing
                 console.log('Renew button disabled, text changed.'); // Debugging log


                // *** Call the backend renew endpoint ***
                const response = await fetch(`/api/borrowings/${borrowingId}/renew/`, {
                     method: 'POST', // Use POST request
                     headers: {
                         'X-CSRFToken': getCookie('csrftoken') // Include CSRF token for security
                     }
                });
                 console.log('Renew fetch response status:', response.status); // Debugging log
                const data = await response.json(); // Parse the JSON response from the backend
                console.log('Received renew response data:', data); // Debugging log


                if (!response.ok) {
                     // Handle non-success HTTP status codes
                     // Re-enable and revert button text on failure
                     renewButton.disabled = false;
                     renewButton.classList.remove('disabled');
                     renewButton.textContent = originalText; // Revert to original text
                     console.error('Backend returned error during renewal:', data); // Debugging log

                     // Show specific error message from backend if available, otherwise a generic one
                     if (data.error) {
                          showNotification(`❌ ${data.error}`);
                     } else {
                         showNotification('❌ Failed to renew book');
                     }
                } else {
                     // *** SUCCESS BLOCK: Backend renewal was successful ***

                     showNotification("✅ Book renewed successfully!"); // Show success notification
                     console.log('Renewal successful. Re-rendering lists to update UI.');

                     // *** CALL THE NEW REFRESH FUNCTION TO UPDATE BOTH LISTS ***
                     // This re-fetches data and redraws the current borrows and history lists.
                     refreshBorrowedPageLists();

                     console.log('Called refreshBorrowedPageLists after successful renewal.');
                }

            } catch (error) {
                 // Handle fetch errors (e.g., network issues)
                 // Re-enable and revert button text on fetch error
                 renewButton.disabled = false;
                 renewButton.classList.remove('disabled');
                 renewButton.textContent = originalText; // Revert to original text
                 console.error('Fetch error during renewal:', error); // Debugging log

                 // Show error notification
                 showNotification(`❌ An error occurred: ${error.message || 'Failed to renew book'}`);
            }

        } else if (returnButton) { // Handle Return button click
            event.preventDefault(); // Prevent default button action

            const borrowingId = returnButton.getAttribute('data-borrowing-id');
            console.log('Return button clicked. Borrowing ID:', borrowingId); // Debugging log


             if (!borrowingId) {
                 console.error('Return button is missing data-borrowing-id attribute.'); // Debugging log
                 showNotification("❌ Error: Could not find borrowing ID for return.");
                 return; // Stop execution
             }

            // Optional: Add a confirmation step before returning
            // if (!confirm("Are you sure you want to return this book?")) {
            //     return; // If user cancels, stop here
            // }

             // Disable button during processing
             returnButton.disabled = true;
             returnButton.classList.add('disabled');
             const originalText = returnButton.textContent; // Store original text
             returnButton.textContent = 'Returning...'; // Change button text
             console.log('Return button disabled, text changed.'); // Debugging log


            try {
                console.log('Preparing to send fetch request for return...'); // Debugging log
                // *** Call the backend return endpoint ***
                const response = await fetch(`/api/borrowings/${borrowingId}/return/`, {
                     method: 'POST', // Use POST request
                     headers: {
                         'X-CSRFToken': getCookie('csrftoken') // Include CSRF token
                     }
                });
                console.log('Received return response status:', response.status); // Debugging log
                const data = await response.json(); // Parse the JSON response
                console.log('Received return response data:', data); // Debugging log


                if (!response.ok) {
                     // Handle non-success HTTP status codes
                     // Re-enable and revert button text on failure
                     returnButton.disabled = false;
                     returnButton.classList.remove('disabled');
                     returnButton.textContent = originalText; // Revert to original text
                     console.error('Backend returned error during return:', data); // Debugging log

                     // Show specific error message from backend if available, otherwise a generic one
                     if (data.error) {
                         showNotification(`❌ ${data.error}`);
                     } else {
                         showNotification('❌ Failed to return book');
                     }
                } else {
                     // *** SUCCESS BLOCK: Backend return was successful ***

                     showNotification("✅ Book returned successfully!"); // Show success notification
                     // Check if the book was returned late and show an additional notification if applicable
                     if (data.returned_late) {
                          const fineMessage = data.fine_amount > 0 ? ` Fine: $${data.fine_amount.toFixed(2)}.` : '.';
                          showNotification(`⚠️ Book returned late${fineMessage}`);
                     }
                     console.log('Return successful. Re-rendering lists to update UI.');


                    // *** Remove the item from the UI with animation for a smoother visual effect ***
                    const borrowedItem = returnButton.closest('.borrowed-item'); // Find the parent item element
                    if (borrowedItem) {
                         // Add a fade out animation
                         borrowedItem.style.animation = 'fadeOut 0.5s forwards';
                         // Listen for the end of the animation
                         borrowedItem.addEventListener('animationend', () => {
                             borrowedItem.remove(); // Remove the item from the DOM after animation
                             console.log('Item removed from UI.'); // Debugging log

                             // *** CALL THE NEW REFRESH FUNCTION AFTER ITEM REMOVAL IS COMPLETE ***
                             // This will re-fetch and redraw the current borrows (removing the returned item)
                             // and the history list (adding the returned item).
                             refreshBorrowedPageLists();
                             console.log('Called refreshBorrowedPageLists after item removal.');
                         });
                    } else {
                         // If finding the item element fails for some reason, still call the refresh function as a fallback
                         console.warn("UI update partial or failed (borrowedItem not found for animation). Calling refresh function directly.");
                         refreshBorrowedPageLists();
                    }
                }

            } catch (error) {
                 // Handle fetch errors
                 // Re-enable and revert button text on fetch error
                 returnButton.disabled = false;
                 returnButton.classList.remove('disabled');
                 returnButton.textContent = originalText; // Revert to original text
                 console.error('Fetch error during return:', error); // Debugging log

                 // Show error notification
                 showNotification(`❌ An error occurred: ${error.message || 'Failed to return book'}`);
            }
        }
    });
}


// Set up functionality after rendering lists (called by render functions)
function refreshItemsFunctionality() {
    // This function is called by renderCurrentBorrows and renderBorrowingHistory
    // setupStarButtons() and setupModalFunctionality() are called within the render functions.
    // This function is now primarily a placeholder if you need to add other setup
    // that applies after any list is rendered.
}

// Listen for tab changes to update functionality
document.querySelectorAll('.tab-input').forEach(tab => {
    tab.addEventListener('change', () => {
        // Use a small delay to ensure the DOM is updated before rendering the new tab's content
        setTimeout(() => {
            // Based on which tab is checked, render the appropriate list
            // Note: Tab changes only render the specific active tab's content for efficiency.
            // The refreshBorrowedPageLists function is designed for updating multiple lists
            // after an action like renew, return, or borrow from the favorites tab.
            if (document.getElementById("tab1").checked) {
                renderCurrentBorrows(); // Render only the Current Borrows tab content
            } else if (document.getElementById("tab2").checked) {
                renderBorrowingHistory(); // Render only the Borrowing History tab content
            } else if (document.getElementById("tab3").checked) {
                renderFavorites(); // Render only the Favorites tab content
            }
        }, 50); // 50ms delay
    });
});

// Initial setup when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Add custom notification styles to the document head if not already added
    // This ensures the notification styles are available as soon as possible.
    if (!document.getElementById('custom-notification-styles')) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'custom-notification-styles';
        // Include all necessary CSS animation and basic button/status styles here
        // These styles are now using CSS variables where applicable based on your _variables.css.
        styleSheet.textContent = `
            /* Custom Notification Styles */
            .custom-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background-color: var(--form-bg-color, #333); /* Use form background or a dark color */
                color: var(--text-color, white); /* Use text color or white */
                padding: 15px 25px;
                border-radius: 5px;
                box-shadow: 0 4px 8px var(--shadow-color, rgba(0, 0, 0, 0.2)); /* Use shadow color */
                z-index: 9999;
                /* Animation defined in showNotification function */
                font-family: var(--font-primary); /* Apply primary font */
            }

            /* Animation Keyframes (keep as is) */
            @keyframes slide-in {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }

            @keyframes fade-out {
                from { opacity: 1; }
                to { opacity: 0; }
            }

            @keyframes fadeOut { /* Added fadeOut animation for list items */
                from { opacity: 1; }
                to { opacity: 0; }
            }

             /* Style for disabled buttons (already using variables) */
            .book-btn:disabled,
            .action-buttons button:disabled {
                background-color: var(--button-color); /* Grey out or a defined button color */
                color: var(--text-secondary); /* Secondary text color for disabled text */
                cursor: not-allowed;
                opacity: 0.7;
            }
             .book-btn:disabled:hover,
             .action-buttons button:disabled:hover {
                background-color: var(--button-color); /* Keep disabled color on hover */
                box-shadow: none;
             }

             /* Styles for status badges (can use variables based on status) */
             .status-badge.available {
                 background-color: var(--primary-color, #4CAF50); /* Green */
                 color: var(--white, white);
                 font-family: var(--font-primary);
             }
             .status-badge.unavailable,
             .status-badge.overdue,
             .status-badge.late-return {
                 background-color: var(--red, #F44336); /* Red */
                 color: var(--white, white);
                 font-family: var(--font-primary);
             }
              .status-badge.due-soon,
              .status-badge.due-tomorrow,
              .status-badge.due-today {
                 background-color: var(--accent-color, #FF9800); /* Accent color or orange */
                 color: var(--white, white);
                 font-family: var(--font-primary);
              }
               .status-badge.on-time,
               .status-badge.returned {
                 background-color: var(--link-color, #2196F3); /* Link color or blue */
                 color: var(--white, white);
                 font-family: var(--font-primary);
               }

              .status-badge {
                 display: inline-block;
                 padding: 4px 8px;
                 border-radius: 4px;
                 font-size: 0.8em;
                 margin-right: 5px;
                 margin-bottom: 5px;
              }
              .format-indicator { /* Keep as is or apply variables if desired */
                 display: inline-block;
                 padding: 2px 6px;
                 border: 1px solid var(--border-color, #ccc);
                 border-radius: 4px;
                 font-size: 0.7em;
                 margin-right: 5px;
                 margin-bottom: 5px;
                 color: var(--text-color, #333);
                 font-family: var(--font-primary);
             }
              .copies-count, .fine-indicator { /* Added fine-indicator */
                display: inline-block;
                padding: 2px 6px;
                border: 1px solid var(--border-color, #ccc);
                border-radius: 4px;
                font-size: 0.7em;
                margin-right: 5px;
                margin-bottom: 5px;
                 color: var(--text-color, #333);
                 font-family: var(--font-primary);
            }
             .availability, .borrowed-details .status-badge { /* Adjusted selector */
                margin-top: 10px; /* Space above availability info */
             }
             .book-details p, .borrowed-details p { /* Apply to both book and borrowed items */
                 margin-bottom: 5px; /* Space below author */
             }
             .book-details h3, .borrowed-details h3 { /* Apply to both */
                 margin-bottom: 5px; /* Space below title */
             }

             /* Basic Star Button Styling (ensure this matches your header/books styles) */
             .star-button {
                 background: none;
                 border: none;
                 cursor: pointer;
                 font-size: 1.2em; /* Adjust size as needed */
                 color: var(--text-secondary, #ccc); /* Default star color (grey) - using secondary text */
                 transition: color 0.2s ease-in-out; /* Smooth color transition */
                 padding: 0; /* Remove default button padding */
                 margin: 0; /* Remove default button margin */
                 position: absolute; /* Position relative to parent */
                 top: 10px; /* Adjust position */
                 right: 10px; /* Adjust position */
                 z-index: 1; /* Ensure it's above other content */
             }

             .star-button.active {
                 color: yellow; /* Active star color (using accent color or gold) */
             }

             .star-button i {
                 pointer-events: none; /* Ensure click goes to the button, not the icon */
             }


             /* Modal styles - Using variables */
             .modal {
                 display: none; /* Hidden by default */
                 position: fixed; /* Stay in place */
                 z-index: 1000; /* Sit on top of everything */
                 left: 0;
                 top: 0;
                 width: 100%; /* Full width */
                 height: 100%; /* Full height */
                 overflow: auto; /* Enable scroll if needed */
                 background-color: var(--overlay-color, rgba(0,0,0,0.4)); /* Background overlay color - use overlay color variable */
                 display: flex; /* Use flexbox to center content */
                 align-items: center; /* Center vertically */
                 justify-content: center; /* Center horizontally */
             }

             .modal.hidden { /* Use .hidden class to control display */
                 display: none; /* Explicitly hide when hidden */
             }

             .modal-content {
                 background-color: var(--form-bg-color, #fefefe); /* Modal background color - use form background variable */
                 border: 1px solid var(--border-color, #888); /* Border color - use border color variable */
                 box-shadow: 0 5px 15px var(--shadow-color, rgba(0,0,0,0.3)); /* Box shadow color - use shadow color variable */
                 margin: auto;
                 padding: 20px;
                 width: 90%;
                 max-width: 700px;
                 border-radius: 8px;
                 position: relative;
                 animation-name: animatetop; /* Add animation for modal entry */
                 animation-duration: 0.4s;
                 font-family: var(--font-primary); /* Apply primary font to modal content */
                 color: var(--text-color, #333); /* Default text color for modal */
             }

             /* Modal Entry Animation */
             @keyframes animatetop {
                 from {top: -300px; opacity: 0}
                 to {top: 0; opacity: 1}
             }


             .close-btn {
                 color: var(--text-secondary, #aaa); /* Close button color - use secondary text color */
                 float: right;
                 font-size: 28px;
                 font-weight: bold;
                 position: absolute;
                 top: 10px;
                 right: 15px;
                 cursor: pointer;
             }

             .close-btn:hover,
             .close-btn:focus {
                 color: var(--text-color, black); /* Close button hover color - use main text color */
                 text-decoration: none;
             }

             .modal-grid {
                 display: grid;
                 grid-template-columns: 1fr 2fr;
                 gap: 20px;
                  align-items: start;
             }

             .modal-image-section img {
                 width: 100%;
                 height: auto;
                 border-radius: 4px;
                 display: block;
             }

             .modal-info-section h2 {
                 margin-top: 0;
                 margin-bottom: 5px;
                 font-size: 1.8em;
                 color: var(--text-color, #333); /* Title color */
             }

             .modal-info-section p {
                 margin-bottom: 15px;
                 line-height: 1.5;
                 font-size: 1em;
                 color: var(--text-color, #333); /* Author/Description color */
             }

             #modal-description {
                 font-style: italic;
                 color: var(--text-secondary, #555); /* Description color - use secondary text */
             }

             .modal-details-grid {
                 display: grid;
                 grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                 gap: 10px;
                 margin-top: 15px;
                 border-top: 1px solid var(--border-color, #eee); /* Separator above details */
                 padding-top: 15px;
             }

             .detail-item {
                 display: flex;
                 justify-content: space-between;
                 align-items: center;
                 border-bottom: 1px dashed var(--border-color, #eee); /* Separator - use border color */
                 padding-bottom: 5px;
                 font-size: 0.9em;
                 color: var(--text-color, #333); /* Default text color for detail item */
             }

             .detail-item strong {
                 margin-right: 10px;
                 flex-shrink: 0;
                 color: var(--text-color, #333); /* Label color */
             }

              .detail-item span {
                  text-align: right;
                  flex-grow: 1;
                  color: var(--text-color, #333); /* Value color */
              }


            /* --- Styles for buttons in the Favorites section (already using variables) --- */
            #favorites .favorite-item .action-buttons .book-btn {
                background-color: var(--primary-color);
                color: var(--white);
                font-family: var(--font-primary);
                border: none;
                padding: 8px 15px;
                border-radius: 4px;
                cursor: pointer;
                margin-right: 10px;
                transition: background-color 0.3s ease;
                font-size: 0.9em;
            }

            #favorites .favorite-item .action-buttons .book-btn:hover:not(:disabled) {
                background-color: var(--primary-hover);
            }

            #favorites .favorite-item .action-buttons .book-btn:disabled {
                background-color: var(--button-color);
                color: var(--text-secondary);
                cursor: not-allowed;
                opacity: 0.7;
            }


            #favorites .favorite-item .action-buttons .remove-favorite-btn {
                background-color: var(--red, #f44336);
                color: var(--white);
                font-family: var(--font-primary);
                border: none;
                padding: 8px 15px;
                border-radius: 4px;
                cursor: pointer;
                transition: background-color 0.3s ease;
                font-size: 0.9em;
            }

            #favorites .favorite-item .action-buttons .remove-favorite-btn:hover {
                background-color: var(--dark-red, #d32f2f);
            }

            #favorites .favorite-item .action-buttons {
                margin-top: 10px;
                display: flex;
                align-items: center;
                flex-wrap: wrap;
            }

        `;
        document.head.appendChild(styleSheet);
    }


    // Initial rendering based on the checked tab or hash on page load
    const hash = window.location.hash;
    if (hash === '#favorites') {
        document.getElementById("tab3").checked = true;
        renderFavorites();
    } else if (hash === '#history') {
        document.getElementById("tab2").checked = true;
        renderBorrowingHistory();
    } else {
        document.getElementById("tab1").checked = true;
        renderCurrentBorrows();
    }

    // Set up modal close listeners that are outside the item-specific ones (attached once)
    const borrowedModal = document.getElementById('borrowed-modal');
    if (borrowedModal) {
         const closeBtn = borrowedModal.querySelector('.close-btn');
          if (closeBtn) {
              closeBtn.addEventListener('click', () => {
                  borrowedModal.classList.add('hidden');
              });
          }
          const modalOverlay = document.getElementById('borrowed-modal');
          if (modalOverlay) {
              modalOverlay.addEventListener('click', (event) => {
                  if (event.target === modalOverlay) {
                      borrowedModal.classList.add('hidden');
                  }
              });
          }
    }
});

// ... (rest of borrowed.js if any other code exists below this) ...