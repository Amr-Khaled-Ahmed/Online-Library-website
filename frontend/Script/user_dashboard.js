const addFriendsBtn = document.querySelector('button[type="submit"]');
if (addFriendsBtn) {
    addFriendsBtn.addEventListener('click', () => {
        const notif = document.createElement('div');
        notif.className = 'custom-notification';
        notif.textContent = '🚧 Friend adding feature coming on next Phase!';
        document.body.appendChild(notif);
        setTimeout(() => {
            notif.remove();
        }, 30000);
    });
}

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
