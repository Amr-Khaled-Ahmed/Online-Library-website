document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded'); // Debug log
    
    const modal = document.getElementById('borrowed-modal');
    const closeBtn = document.querySelector('.close-btn');
    const borrowedItems = document.querySelectorAll('.borrowed-item');

    console.log('Modal element:', modal); // Debug log
    console.log('Number of borrowed items:', borrowedItems.length); // Debug log

    // Add click event to each borrowed item
    borrowedItems.forEach(item => {
        item.addEventListener('click', function() {
            console.log('Item clicked'); // Debug log
            
            const title = this.querySelector('.borrowed-title').textContent;
            const author = this.querySelector('.borrowed-author').textContent;
            const cover = this.querySelector('.borrowed-cover img')?.src || '';
            const borrowedDate = this.querySelector('.info-item:nth-child(1) .info-value').textContent;
            const dueDate = this.querySelector('.info-item:nth-child(2) .info-value').textContent;
            const status = this.querySelector('.status-badge').textContent;
            const format = this.querySelector('.info-item:nth-child(4) .info-value').textContent;
            const renewals = this.querySelector('.info-item:nth-child(3) .info-value').textContent;

            console.log('Modal data:', { title, author, cover }); // Debug log

            // Update modal content
            document.getElementById('modal-title').textContent = title;
            document.getElementById('modal-author').textContent = author;
            document.getElementById('modal-image').src = cover;
            document.getElementById('modal-borrowed-date').textContent = borrowedDate;
            document.getElementById('modal-due-date').textContent = dueDate;
            document.getElementById('modal-status').textContent = status;
            document.getElementById('modal-format').textContent = format;
            document.getElementById('modal-renewals').textContent = renewals;

            // Show modal
            modal.style.display = 'block'; // Changed from classList.remove('hidden')
            console.log('Modal should be visible now'); // Debug log
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
