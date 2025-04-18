window.addEventListener("DOMContentLoaded", () => {
    if (window.location.hash === "#favorites") {
      document.getElementById("tab3").checked = true;
    }
});
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
const deleteButtons = document.querySelectorAll('.delete_book');
const modal = document.getElementById('confirm-modal');
const confirmYes = document.getElementById('confirm-yes');
const confirmNo = document.getElementById('confirm-no');
document.addEventListener('DOMContentLoaded', () => {
    deleteButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            bookToDelete = e.target.closest('.favorite-item');
            modal.classList.remove('hidden');
        });
    });
});
confirmYes.addEventListener('click', () => {
    if (bookToDelete) {
      bookToDelete.remove();
      bookToDelete = null;
    }
    modal.classList.add('hidden');
});

confirmNo.addEventListener('click', () => {
    bookToDelete = null;
    modal.classList.add('hidden');
});


const ReturnButtons = document.querySelectorAll('.return-btn');
ReturnButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const notif = document.createElement('div');
        notif.className = 'custom-notification';
        notif.textContent = '🔙 Return feature coming in the next phase!';
        document.body.appendChild(notif);
        setTimeout(() => {
            notif.remove();
        }, 3000);
    });
});
const RenewButtons = document.querySelectorAll('.renew-btn');
RenewButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const notif = document.createElement('div');
        notif.className = 'custom-notification';
        notif.textContent = '🔙 Renew feature coming in the next phase!';
        document.body.appendChild(notif);
        setTimeout(() => {
            notif.remove();
        }, 3000);
    });
});