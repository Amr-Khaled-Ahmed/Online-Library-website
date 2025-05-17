document.addEventListener('DOMContentLoaded', function() {

    document.getElementById('add-book').addEventListener('click',() => {
        window.location.href = "./add-edit";
    });

    document.querySelector('.close-btn').addEventListener('click',() => {
        document.querySelector('.overlayer').classList.add('hide');
        document.querySelector('.list').classList.add('hide');
        document.querySelector('.users').classList.add('hide');
        document.querySelector('.no-users').classList.add('hide');
        document.querySelector('.copies-list').classList.add('hide');
    });

    window.addEventListener("click", (e) => {
        if (e.target === document.querySelector('.overlayer')) {
            document.querySelector('.overlayer').classList.add('hide');
            document.querySelector('.list').classList.add('hide');
            document.querySelector('.users').classList.add('hide');
            document.querySelector('.no-users').classList.add('hide');
            document.querySelector('.copies-list').classList.add('hide');
        }
    });

    document.querySelector('.search-form').addEventListener('submit', () => {
        let overlayer = document.querySelector('.overlayer');
        let loading = document.querySelector('.loading');
        overlayer.classList.remove('hide');
        loading.classList.remove('hide');
        setTimeout(() => {
            overlayer.classList.add('hide');
            loading.classList.add('hide');
        },300);
    });

    document.querySelector('.formats-form').addEventListener('submit', (e) => {
        e.preventDefault();

        const copies = {
            bookId: document.querySelector('.list').getAttribute('bookId'),
            hardcover: document.getElementById('hardcover-copies').value.trim() === "" ? 0 : Number(document.getElementById('hardcover-copies').value),
            paperback: document.getElementById('paperback-copies').value.trim() === "" ? 0 : Number(document.getElementById('paperback-copies').value),
            ebook: document.getElementById('ebook-availability').checked,
            audiobook: document.getElementById('audiobook-availability').checked,
        }

        fetch('api/copies/add-copies', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify(copies)
        })
        .then(response => response.json());

        saveNotification()

        document.querySelector('.overlayer').classList.add('hide');
        document.querySelector('.list').classList.add('hide');
        document.querySelector('.copies-list').classList.add('hide');
        document.getElementById('hardcover-copies').value = '';
        document.getElementById('paperback-copies').value = '';
    });
});

window.addEventListener('load', () => {
    if (window.sessionStorage.getItem('save') === 'true') {
        window.sessionStorage.removeItem('save','true');
        saveNotification()
    }
});

function saveNotification() {
    // Display Notification
    let savedNotification = document.querySelector('.saved');
    savedNotification.classList.remove('hide');
    savedNotification.style.animation = 'notification 1.7s ease-in-out 2s backwards';
    savedNotification.addEventListener('animationend', () => {
        savedNotification.classList.add('hide');
        savedNotification.style.animation = '';
    },{once: true});
}



// Event Delegation to deal with AJAX
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('delete')) {
        const bookId = event.target.getAttribute('data-id');
        handleDelete(bookId);
    }
    else if(event.target.classList.contains('edit')) {
        const bookId = event.target.getAttribute('data-id');
        window.sessionStorage.setItem('edit', 'true');
        window.sessionStorage.setItem('bookId',`${bookId}`);
        window.location.href = './add-edit';
    }
    else if(event.target.classList.contains('copies',) ||
            event.target.classList.contains('borrowers-list-btn')) {
        document.querySelector('.overlayer').classList.remove('hide');
        document.querySelector('.list').classList.remove('hide');

        const bookId = event.target.getAttribute('data-id');
        fetch(`get-book/${bookId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error("Book not found");
            }
            return response.json();
        })
        .then(data => {
            document.querySelector('.list img').src = data.coverPath;
            document.querySelector('.list .isbn').innerHTML = 'ISBN: ' + data.isbn;
            document.querySelector('.list .book-title').innerHTML = data.title;
            document.querySelector('.list .author').innerHTML = 'By ' + data.author;
            document.querySelector('.list').setAttribute('bookId',`${bookId}`);
        })
        .catch(error => {
            console.error("Error fetching book:", error);
        });

        if(event.target.classList.contains('copies')) {
            document.querySelector('.copies-list').classList.remove('hide');
            
            fetch(`api/copies/get-copies/${bookId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error("Book not found");
                }
                return response.json();
            })
            .then(data => {
                console.log(data.ebook);
                document.getElementById('available-hardcover-copies').innerHTML = 'Available: ' + data.hardcover;
                document.getElementById('available-paperback-copies').innerHTML = 'Available: ' + data.paperback;
                document.getElementById('ebook-availability').checked = data.ebook;
                document.getElementById('audiobook-availability').checked = data.audiobook;
            })
            .catch(error => {
                console.error("Error fetching book:", error);
            });
        }
        else {
            document.querySelector('.users').classList.remove('hide');

            fetch(`api/users/borrowers/${bookId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error("Book not found");
                }
                return response.json();
            })
            .then(data => {
                if(!data.borrowers || data.borrowers.length == 0) {
                    document.querySelector('.no-users').classList.remove('hide');
                }
                else {
                    let usersList = document.querySelector('.users');
                    data.borrowers.foreach(borrow => {
                        let userDiv = document.createElement('div');
                        userDiv.classList.add('user');
                
                        let profilePicHolder = document.createElement('div');
                        profilePicHolder.classList.add('profile-pic-holder');
                
                        let profilePic = document.createElement('img');
                        profilePic.src = user.profilePic ? user.profilePic : './../CSS/assets/blue.avif';
                        profilePic.alt = 'Profile Picture';
                        profilePic.classList.add('profile-pic');
                
                        let info = document.createElement('div');
                        info.classList.add('info');
                
                        let username = document.createElement('p');
                        username.textContent = 'Username: ' + user.username;

                        let format = document.createElement('p');
                        format.textContent = 'Format: ' + borrow.format;

                        let borrowDate = document.createElement('p');
                        borrowDate.textContent = 'Borrow Date: ' + new Date(borrow.borrow_date).toLocaleString('en-US', { month: 'long' }) 
                                                + ' ' + new Date(borrow.borrow_date).getDate()
                                                + ', ' + new Date(borrow.borrow_date).getFullYear();

                        let dueDate = document.createElement('p');
                        dueDate.textContent = 'Due Date: ' + new Date(borrow.return_date).toLocaleString('en-US', { month: 'long' }) 
                                                + ' ' + new Date(borrow.return_date).getDate()
                                                + ', ' + new Date(borrow.return_date).getFullYear();
                        
                        info.appendChild(username);
                        info.append(format);
                        info.appendChild(borrowDate);
                        info.appendChild(dueDate);

                        profilePicHolder.appendChild(profilePic);

                        userDiv.appendChild(profilePicHolder);
                        userDiv.appendChild(info);

                        usersList.appendChild(userDiv);
                    });
                }
            })
            .catch(error => {
                console.error("Error fetching book:", error);
            });
        }
    }
});


// Confirm to delete book
function deleteBook(id) {
    let overlayer = document.querySelector('.overlayer');
    let confirmation = document.querySelector('.confirmation');
    let deleteNotification = document.querySelector('.deleted');
    overlayer.classList.remove('hide');
    confirmation.classList.remove('hide');

    fetch(`get-book/${id}`)
    .then(response => {
        if (!response.ok) {
            throw new Error("Book not found");
        }
        return response.json();
    })
    .then(data => {
        document.querySelector('.confirmation img').src = data.coverPath;
        document.querySelector('.confirmation .isbn').innerHTML = 'ISBN: ' + data.isbn;
        document.querySelector('.confirmation .book-title').innerHTML = data.title;
        document.querySelector('.confirmation .author').innerHTML = 'By ' + data.author;
    })
    .catch(error => {
        console.error("Error fetching book:", error);
    });

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

async function handleDelete(id) {
    const willDelete = await deleteBook(id);
    if(willDelete) {
        fetch('/delete-book', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken'),
            },
            body: JSON.stringify({ book_id: id })
        });
    }
}

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.startsWith(name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}