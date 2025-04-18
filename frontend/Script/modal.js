const modal = document.getElementById("book-modal");
const closeModal = document.querySelector(".close-btn");

document.querySelectorAll(".book-item").forEach(item => {
    item.addEventListener("click", function () {
        const title = this.querySelector(".book-title").textContent;
        const author = this.querySelector(".book-author").textContent;
        const year = this.querySelector(".book-meta span:nth-child(3)").textContent;
        const genre = this.querySelector(".book-meta span:nth-child(1)").textContent;
        const format = this.querySelector(".book-meta span:nth-child(2)").textContent;
        const status = this.querySelector(".availability-badge").textContent;
        const img = this.querySelector("img")?.src || '';
        const description = `This is a short description about the book "${title}".`;

        
        document.getElementById("modal-title").textContent = title;
        document.getElementById("modal-author").textContent = author;
        document.getElementById("modal-year").textContent = year;
        document.getElementById("modal-genre").textContent = genre + ", " + format;
        document.getElementById("modal-status").textContent = status;
        document.getElementById("modal-description").textContent = description;
        document.getElementById("modal-language").textContent = "English";
        document.getElementById("modal-pages").textContent = "320";
        document.getElementById("modal-image").src = img;

        modal.classList.remove("hidden");
    });
});

closeModal.addEventListener("click", () => {
    modal.classList.add("hidden");
});

window.addEventListener("click", (e) => {
    if (e.target === modal) {
        modal.classList.add("hidden");
    }
});
