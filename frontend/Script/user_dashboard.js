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
