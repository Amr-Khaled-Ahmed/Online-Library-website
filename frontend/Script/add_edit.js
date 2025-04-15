document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('back').addEventListener('click',() => {
        window.location.href = "./admin_dashboard.html";
        if(window.sessionStorage.getItem('edit') !== null)
            window.sessionStorage.removeItem('edit');
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
        }
    });
});

// Save Book to database
function saveBook(book) {
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

    
}