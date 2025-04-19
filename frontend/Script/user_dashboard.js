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
// Add friend function
const friends = [];
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
function submitForm() {
    const type = document.getElementById('entry-type').value;
    const name = document.getElementById('friend-name').value.trim();
    const email = document.getElementById('friend-email').value.trim().toLowerCase();
    if (type === 'name') {
        if (name.length < 2) {
            showAlert("Please enter a valid name.");
            return;
        }
        friends.push({ name, email: '' });
        updateFriendList();
    } else if (type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showAlert("Please enter a valid email.");
            return;
        }
        friends.push({ name: '', email });
        updateFriendList();
    }
    hidePopup();
}
let friendIndexToDelete = null;
function updateFriendList() {
    const listDiv = document.getElementById('friend-list');
    listDiv.innerHTML = '';

    if (friends.length === 0) {
        listDiv.innerHTML = '<p>No friends added yet.</p>';
        return;
    }
    friends.forEach((friend, index) => {
        const container = document.createElement('div');
        container.classList.add('friend-entry');
        const span = document.createElement('span');
        span.textContent = friend.name ? friend.name : friend.email;
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.id = `confirm-no-${index}`;
        deleteBtn.classList.add('delete-friend');
        deleteBtn.addEventListener('click', () => {
            friendIndexToDelete = index;
            document.getElementById('confirm-text').textContent = `Are you sure you want to delete "${span.textContent}"?`;
            document.getElementById('confirm-modal').classList.remove('hidden');
        });
        container.appendChild(span);
        container.appendChild(deleteBtn);
        listDiv.appendChild(container);
    });
}
document.getElementById('confirm-yes').addEventListener('click', () => {
    if (friendIndexToDelete !== null) {
        friends.splice(friendIndexToDelete, 1);
        updateFriendList();
        friendIndexToDelete = null;
    }
    document.getElementById('confirm-modal').classList.add('hidden');
});
document.getElementById('confirm-no').addEventListener('click', () => {
    friendIndexToDelete = null;
    document.getElementById('confirm-modal').classList.add('hidden');
});
