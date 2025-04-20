document.querySelectorAll('.star-button').forEach(button => {
    button.addEventListener('click', (event) => {
        event.stopPropagation();
        button.classList.toggle('active');
    });
});
