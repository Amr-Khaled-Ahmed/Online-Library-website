document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('back').addEventListener('click',() => {
        window.location.href = "./admin_dashboard.html";
        if(window.sessionStorage.getItem('edit') !== null)
            window.sessionStorage.removeItem('edit');
    })

    document.querySelector('form').addEventListener('submit', () => {
        sessionStorage.setItem('showMessage', 'true');

        // Save book info
        const bookData = {
            title: document.getElementById('title').value,
            author: document.getElementById('author').value,
            coverPath: document.querySelector('.book-cover').src,
            genre: document.getElementById('genre').value,
            format: document.getElementById('format').value,
            yearPub: document.getElementById('pub-time').value,
            availability: document.getElementById('availability').value,
            borrowNum: (window.sessionStorage.getItem('edit') === 'true') ? bookParams.get('borrowNum') : '0',
            maxDuration: document.getElementById('mx-brw-dur').value,
            lateFees: document.getElementById('late-fee').value
        };


        // Save book to database

    });

    document.getElementById('save').addEventListener('click',() => saveBook(book));

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
            input.value = '';
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = function(e) {
            img.src = e.target.result;
            document.querySelector('.upload').style.display = 'none';
            img.classList.remove('hide');
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
        imgHolder.style.border = '3px dashed #9ea1a4';
        if(img.naturalWidth > 0 && img.style.display !== 'none') {
            img.style.opacity = 0.3;
        }
    }

    function notUpdated() {
        if(img.naturalWidth > 0 && img.style.display !== 'none') {
            document.querySelector('.upload').style.display = 'none';
            imgHolder.style.border = 'none';
            img.style.opacity = 1;
        }
    }

    imgHolder.addEventListener('mouseover',() => willUpdate());
    imgHolder.addEventListener('dragover',() => willUpdate());

    imgHolder.addEventListener('mouseout',() => notUpdated());
    imgHolder.addEventListener('dragleave',() => notUpdated());

    window.addEventListener('load',() => {
        if(window.sessionStorage.getItem('edit') === 'true') {
            const bookParams = new URLSearchParams(window.location.search);
            
            document.querySelector('.upload').style.display = 'none';
            let img = document.querySelector('.book-cover');
            img.classList.remove('hide');
            img.src = bookParams.get('coverPath');
            document.getElementById('title').value = bookParams.get('title');
            document.getElementById('author').value = bookParams.get('author');
            document.getElementById('genre').value = bookParams.get('genre');
            document.getElementById('format').value = bookParams.get('format');
            document.getElementById('availability').value = bookParams.get('availability');
            document.getElementById('pub-time').value = bookParams.get('yearPub');
            document.getElementById('late-fee').value = bookParams.get('lateFees');
            document.getElementById('mx-brw-dur').value = bookParams.get('maxDuration');
        }
        else {
            document.querySelector('.upload').style.display = 'flex';
        }
    });
});