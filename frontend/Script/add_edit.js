document.addEventListener('DOMContentLoaded', function() {
    // Save book
    document.getElementById('back').addEventListener('click',() => {
        window.sessionStorage.removeItem('editedBook');
        window.location.href = "./admin_dashboard.html";
    });

    document.getElementById('id').addEventListener('input',() => {
        if(takenID())
            document.getElementById('id-validation').classList.remove('hide');
        else
            document.getElementById('id-validation').classList.add('hide');
    });

    document.querySelector('form').addEventListener('submit',(e) => {
        e.preventDefault();

        if(takenID()) {
            document.getElementById('id-validation').classList.remove('hide');
            return;
        }

        // Check not empty book cover
        let img = document.querySelector('.book-cover');
        if(img.classList.contains('hide') || img.naturalWidth == 0) {
            document.getElementById('book-cover-validation').classList.remove('hide');
            return;
        }

        const bookParams = new URLSearchParams(window.location.search);
        // Save book info
        const bookData = {
            id: id.value,
            title: document.getElementById('title').value,
            author: document.getElementById('author').value,
            // coverPath: document.querySelector('.book-cover').src,
            genre: document.getElementById('genre').value,
            format: document.getElementById('format').value,
            pubYear: document.getElementById('pub-year').value,
            availability: document.getElementById('availability').value,
            borrowNum: (window.sessionStorage.getItem('edit') === 'true') ? bookParams.get('borrowNum') : '0',
            lateFees: document.getElementById('late-fee').value,
        };

        // Send book info to admin dashboard and save there (temporary), no need with database
        const dataParams = new URLSearchParams();
        for(const [key,value] of Object.entries(bookData)) {
            dataParams.append(key,value);
        }
        window.sessionStorage.setItem('save','true');
        // The link is too long
        window.sessionStorage.setItem('coverPath',document.querySelector('.book-cover').src);
        window.sessionStorage.setItem('description',document.getElementById('description').value);

        // Save book to database

        window.location.href = `./admin_dashboard.html?${dataParams.toString()}`;
    });

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
            const bookParams = new URLSearchParams(window.location.search);
            if(bookParams.size == 0) {
                window.sessionStorage.removeItem('edit');
                return;
            }
            
            document.querySelector('.upload').style.display = 'none';
            let img = document.querySelector('.book-cover');
            img.src = window.sessionStorage.getItem('coverPath');
            document.getElementById('id').value = bookParams.get('id');
            document.getElementById('title').value = bookParams.get('title');
            document.getElementById('author').value = bookParams.get('author');
            document.getElementById('genre').value = bookParams.get('genre');
            document.getElementById('format').value = bookParams.get('format');
            document.getElementById('availability').value = bookParams.get('availability');
            document.getElementById('pub-year').value = bookParams.get('pubYear');
            document.getElementById('late-fee').value = bookParams.get('lateFees');

            img.classList.remove('hide');

            document.getElementById('description').value = window.sessionStorage.getItem('description');
            window.sessionStorage.removeItem('description');
            window.sessionStorage.removeItem('coverPath');
        }
        else {
            document.querySelector('.upload').style.display = 'flex';
            document.getElementById('genre').value = '';
            document.getElementById('format').value = '';
            document.getElementById('availability').value = '';
            document.getElementById('pub-year').value = '';
        }
        // if(!img.classList.contains('hide') && img.naturalWidth == 0) {
        //     img.classList.add('hide');
        //     document.querySelector('.upload').style.display = 'flex';
        // }
    });
});

// Check not taken id
function takenID() {
    let books = JSON.parse(window.localStorage.getItem('books'));
    let id = document.getElementById('id').value;
    let taken = false;
    books.forEach(book => {
        if(book.id == id && window.sessionStorage.getItem('editedBook') !== id)
            taken = true;
    });
    return taken;
}
