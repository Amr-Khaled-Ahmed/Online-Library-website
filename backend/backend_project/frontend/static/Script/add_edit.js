document.addEventListener('DOMContentLoaded', function() {
    // Save book
    document.getElementById('back').addEventListener('click',() => {
        window.sessionStorage.removeItem('edit');
        window.sessionStorage.removeItem('bookId');
        window.location.href = "./admin-dashboard";
    });

    document.getElementById('isbn').addEventListener('input',() => {
        document.getElementById('isbn-validation').classList.add('hide');
    });

    document.querySelector('form').addEventListener('submit',async (e) => {
        e.preventDefault();

        const exists = await existISBN();

        if(exists) {
            document.getElementById('isbn-validation').classList.remove('hide');
            return;
        }

        // Check not empty book cover
        let img = document.querySelector('.book-cover');
        if(img.classList.contains('hide') || img.naturalWidth == 0) {
            document.getElementById('book-cover-validation').classList.remove('hide');
            return;
        }

        // book info
        const bookData = {
            isbn: document.getElementById('isbn').value,
            title: document.getElementById('title').value,
            author: document.getElementById('author').value,
            coverPath: document.querySelector('.book-cover').src,
            genre: document.getElementById('genre').value,
            pubYear: document.getElementById('pub-year').value,
            pageCount: document.getElementById('page-count').value,
            description: document.getElementById('description').value,
        };


        if(window.sessionStorage.getItem('edit') === 'true') {
            // Edit book in database
            fetch(`/edit-book/${window.sessionStorage.getItem('bookId')}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify(bookData)
                })
            .then(response => response.json())
            .then(() => {
                // Return to Admin Dashboard
                window.sessionStorage.removeItem('edit');
                window.sessionStorage.removeItem('bookId');
                window.sessionStorage.setItem('save','true');
                window.location.href = './admin-dashboard'
            });
        }
        else {
            // Save book to database
            fetch('/add-book', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify(bookData)
                })
            .then(response => response.json())
            .then(() => {
                // Return to Admin Dashboard
                window.sessionStorage.setItem('save','true');
                window.location.href = './admin-dashboard'
            });
        }
    });

    function existISBN() {
        let isbn = document.getElementById('isbn').value;
        let bookId = window.sessionStorage.getItem('bookId')

        let url = bookId
        ? `api/books/check-isbn/${isbn}/${bookId}`
        : `api/books/check-isbn/${isbn}`;

        return fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error("Book not found");
            }
            return response.json();
        })
        .then(data => {
            return data.exist;
        })
        .catch(error => {
            console.error("Error fetching book:", error);
            return false;
        });
    }


    // Upload book cover
    let imgHolder = document.querySelector('.img-holder');
    let imgInput = document.getElementById('img-input');
    let img = document.querySelector('.book-cover');
    let errorNotification = document.querySelector('.error');

    function loadImg(files) {
        const file = files[0];
        if(!file.type.match('image.*')) {
            errorNotification.classList.remove('hide');
            errorNotification.style.animation = 'notification 1.7s ease-in-out 2s backwards';
            errorNotification.addEventListener('animationend',() => {
                errorNotification.classList.add('hide');
                errorNotification.style.animation = '';
            });
            imgInput.value = '';
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = function(e) {
            img.src = e.target.result;
            document.querySelector('.upload').style.display = 'none';
            img.classList.remove('hide');
            document.getElementById('book-cover-validation').classList.add('hide');
        }
    }
    imgHolder.addEventListener('click',() => imgInput.click());
    imgInput.addEventListener('change', () => {
        if(imgInput.files.length) {
            loadImg(imgInput.files);
        }
    });

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        imgHolder.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    imgHolder.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;

        if (files.length) {
            loadImg(files);
        }
    });

    function willUpdate() {
        document.querySelector('.upload').style.display = 'flex';
        imgHolder.style.border = '2px dashed #9ea1a4';
        if(img.naturalWidth > 0 && !img.classList.contains('hide')) {
            img.style.opacity = 0.3;
        }
    }

    function notUpdated() {
        if(img.naturalWidth > 0 && !img.classList.contains('hide')) {
            document.querySelector('.upload').style.display = 'none';
            imgHolder.style.border = 'none';
            img.style.opacity = 1;
        }
    }

    imgHolder.addEventListener('mouseover',() => willUpdate());
    imgHolder.addEventListener('dragover',() => willUpdate());

    imgHolder.addEventListener('mouseout',() => notUpdated());
    imgHolder.addEventListener('dragleave',() => notUpdated());

    // Reset book cover
    document.getElementById('reset').addEventListener('click',() => {
        img.classList.add('hide');
        document.querySelector('.upload').style.display = 'flex';
        imgHolder.style.border = '2px dashed #9ea1a4';
        imgInput.value = '';
    });

    window.addEventListener('load',() => {
        if(window.sessionStorage.getItem('edit') === 'true') {
            const bookId = window.sessionStorage.getItem('bookId');

            fetch(`get-book/${bookId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error("Book not found");
                }
                return response.json();
            })
            .then(data => {
                document.querySelector('.upload').style.display = 'none';
                let img = document.querySelector('.book-cover');
                img.src = data.coverPath;
                img.classList.remove('hide');

                document.getElementById('isbn').value = data.isbn;
                document.getElementById('title').value = data.title;
                document.getElementById('author').value = data.author;
                document.getElementById('genre').value = data.genre;
                document.getElementById('pub-year').value = data.pubYear;
                document.getElementById('page-count').value = data.pageCount;
                document.getElementById('description').value = data.description;
            })
            .catch(error => {
                console.error("Error fetching book:", error);
            });
        }
        else {
            document.querySelector('.upload').style.display = 'flex';
            document.getElementById('genre').value = '';
            document.getElementById('pub-year').value = '';
        }
    });
});

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