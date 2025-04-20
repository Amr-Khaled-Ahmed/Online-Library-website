document.addEventListener('DOMContentLoaded', function() {
    // Save book
    document.getElementById('back').addEventListener('click',() => {
        window.location.href = "./admin_dashboard.html";
        if(window.sessionStorage.getItem('edit') !== null) {
            window.sessionStorage.removeItem('edit','true');
            window.sessionStorage.removeItem('editedBook',window.sessionStorage.getItem('editedBook'));
        }
    })

    document.querySelector('form').addEventListener('submit',(e) => {
        e.preventDefault();
        const bookParams = new URLSearchParams(window.location.search);
        // Save book info
        const bookData = {
            title: document.getElementById('title').value,
            author: document.getElementById('author').value,
            // coverPath: document.querySelector('.book-cover').src,
            genre: document.getElementById('genre').value,
            format: document.getElementById('format').value,
            pubYear: document.getElementById('pub-time').value,
            availability: document.getElementById('availability').value,
            borrowNum: (window.sessionStorage.getItem('edit') === 'true') ? bookParams.get('borrowNum') : '0',
            maxDuration: document.getElementById('mx-brw-dur').value,
            lateFees: document.getElementById('late-fee').value
        };

        // Send book info to admin dashboard and save there (temporary), no need with database
        const dataParams = new URLSearchParams();
        for(const [key,value] of Object.entries(bookData)) {
            dataParams.append(key,value);
        }
        window.sessionStorage.setItem('save','true');
        // The link is too long
        window.sessionStorage.setItem('coverPath',document.querySelector('.book-cover').src);

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
        imgHolder.style.border = '3px dashed #9ea1a4';
        imgInput.value = '';
    });

    window.addEventListener('load',() => {
        if(window.sessionStorage.getItem('edit') === 'true') {
            const bookParams = new URLSearchParams(window.location.search);
            
            document.querySelector('.upload').style.display = 'none';
            let img = document.querySelector('.book-cover');
            img.classList.remove('hide');
            img.src = window.sessionStorage.getItem('coverPath');
            window.sessionStorage.removeItem('coverPath',img.src)
            document.getElementById('title').value = bookParams.get('title');
            document.getElementById('author').value = bookParams.get('author');
            document.getElementById('genre').value = bookParams.get('genre');
            document.getElementById('format').value = bookParams.get('format');
            document.getElementById('availability').value = bookParams.get('availability');
            document.getElementById('pub-time').value = bookParams.get('pubYear');
            document.getElementById('late-fee').value = bookParams.get('lateFees');
            document.getElementById('mx-brw-dur').value = bookParams.get('maxDuration');
        }
        else {
            document.querySelector('.upload').style.display = 'flex';
        }
    });
});