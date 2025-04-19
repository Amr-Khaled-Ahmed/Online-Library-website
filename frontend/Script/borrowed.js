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



document.addEventListener('DOMContentLoaded', function() {
    
    
    const modal = document.getElementById('borrowed-modal');
    const closeBtn = document.querySelector('.close-btn');
    const borrowedItems = document.querySelectorAll('.borrowed-item');

     

    // Add click event to each borrowed item
    borrowedItems.forEach(item => {
        item.addEventListener('click', function(event) {
            // Check if the clicked element is a button or is inside a button
            if (event.target.closest('button')) {
                return; // Exit the function if a button was clicked
            }
            
            
            
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

            
            modal.style.display = 'block';  
            
        });
    });

    // Close modal when clicking the close button
    closeBtn.addEventListener('click', function() {
        modal.style.display = 'none'; // Changed from classList.add('hidden')
    });

    // Close modal when clicking outside the modal content
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none'; // Changed from classList.add('hidden')
        }
    });
});