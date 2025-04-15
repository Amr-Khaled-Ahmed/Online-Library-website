document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('back').addEventListener('click',() => {
        window.location.href = "./admin_dashboard.html";
    })

    document.querySelector('form').addEventListener('submit', () => {
        sessionStorage.setItem('showMessage', 'true');
    });
    document.getElementById('save').addEventListener('click',() => saveBook(book));

    window.addEventListener('load',() => {
        if(window.sessionStorage.getItem('edit') === 'true') {
            const bookParams = new URLSearchParams(window.location.search);

            document.querySelector('.book-cover').src = bookParams.get('coverPath');
            document.getElementById('title').value = bookParams.get('title');
            document.getElementById('author').value = bookParams.get('author');
            document.getElementById('genre').value = bookParams.get('genre');
            document.getElementById('format').value = bookParams.get('format');
            document.getElementById('availability').value = bookParams.get('availability');
            document.getElementById('pub-time').value = bookParams.get('yearPub');
            document.getElementById('late-fee').value = bookParams.get('lateFees');
            document.getElementById('mx-brw-dur').value = bookParams.get('maxDuration');

            window.sessionStorage.removeItem('edit');
        }
    });
});

// Save Book to database
function saveBook(book) {
    
}