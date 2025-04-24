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
    document.getElementById('overlay').style.display = 'block';
}

function hidePopup() {
    document.getElementById('popup').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
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


function submitForm() {
    const type = document.getElementById('entry-type').value;
    const name = document.getElementById('friend-name').value.trim();
    const email = document.getElementById('friend-email').value.trim().toLowerCase();
    
    const loggedInUser = JSON.parse(localStorage.getItem('loggedIn_user'));
    if (!loggedInUser) {
        showMessagePopup("You need to be logged in to add friends.");
        return;
    }

    let friends = JSON.parse(localStorage.getItem(`friends_${loggedInUser.username}`)) || [];

    if (type === 'name') {
        if (name.length < 2) {
            showMessagePopup("Please enter a valid name.");
            return;
        }

        const nameIsValid = /^[A-Za-z]+$/.test(name);
        if (!nameIsValid) {
            showMessagePopup("Please enter a name with alphabetic characters only.");
            return;
        }

        const exists = friends.some(friend => friend.name.toLowerCase() === name.toLowerCase());
        if (exists) {
            showMessagePopup(`"${name}" is already in your friend list.`);
            return;
        }

        friends.push({ name, email: '' });

    } else if (type === 'email') {
        if (!email || !email.includes('@')) {
            showMessagePopup("Please enter a valid email.");
            return;
        }

        const exists = friends.some(friend => friend.email === email);
        if (exists) {
            showMessagePopup("This email is already associated with a friend.");
            return;
        }

        const friendIndex = friends.findIndex(friend => friend.name && !friend.email);
        if (friendIndex === -1) {
            showMessagePopup("Please enter a valid name before adding an email.");
            return;
        }

        friends[friendIndex].email = email;
    }

    localStorage.setItem(`friends_${loggedInUser.username}`, JSON.stringify(friends));

    updateFriendList();
    hidePopup();
}



let friendIndexToDelete = null;
function updateFriendList() {
    const listDiv = document.querySelector('.friend-list');
    listDiv.innerHTML = '';

    const loggedInUser = JSON.parse(localStorage.getItem('loggedIn_user'));
    if (!loggedInUser) {
        showMessagePopup("You need to be logged in to view your friends.");
        return;
    }

    const friends = JSON.parse(localStorage.getItem(`friends_${loggedInUser.username}`)) || [];

    if (friends.length === 0) {
        listDiv.innerHTML = 'No friends available';
        listDiv.style.color = 'red';
        listDiv.style.fontSize = '24px';
        return;
    }

    let x = 0;
    friends.forEach((friend, index) => {
        const container = document.createElement('div');
        container.classList.add('friend-entry');
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.marginBottom = '2%';

        const img = document.createElement('img');
        img.src = "../CSS/assets/blue.avif";
        img.alt = "Friend Avatar";

        const span = document.createElement('span');
        span.textContent = friend.email ? `${friend.name} (${friend.email})` : friend.name;


        const statusSpan = document.createElement('span');
        if (x % 2 === 0) {
            statusSpan.textContent = 'Finished';
            statusSpan.style.color = 'green';
        }
        else {
            statusSpan.textContent = 'On Reading';
            statusSpan.style.color = 'red';
        }
        x++;
        statusSpan.style.marginLeft = '10px';
        
        container.appendChild(img);
        container.appendChild(span);
        container.appendChild(statusSpan);

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.classList.add('delete-friend');
        deleteBtn.style.marginLeft = 'auto';
        deleteBtn.addEventListener('click', () => {
            const friendName = span.textContent;
            friendIndexToDelete = index;
            document.getElementById('confirm-text').textContent =
                `Are you sure you want to delete "${friendName}"?`;
            document.getElementById('confirm-modal').classList.remove('hidden');
            document.getElementById('overlay').classList.remove('hidden');
        });
        container.appendChild(deleteBtn);
        listDiv.appendChild(container);
    });
}

updateFriendList();


document.getElementById('confirm-yes').addEventListener('click', () => {
    if (friendIndexToDelete !== null) {
        // Remove the friend from storage
        const loggedInUser = JSON.parse(localStorage.getItem('loggedIn_user'));
        let friends = JSON.parse(localStorage.getItem(`friends_${loggedInUser.username}`)) || [];
        friends.splice(friendIndexToDelete, 1);
        // Save on local storage
        localStorage.setItem(`friends_${loggedInUser.username}`, JSON.stringify(friends));

        updateFriendList();
        friendIndexToDelete = null;
    }
    document.getElementById('confirm-modal').classList.add('hidden');
    document.getElementById('overlay').classList.add('hidden');
});

document.getElementById('confirm-no').addEventListener('click', () => {
    friendIndexToDelete = null;
    document.getElementById('confirm-modal').classList.add('hidden');
    document.getElementById('overlay').classList.add('hidden');
});
