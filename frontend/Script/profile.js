const imgInput = document.getElementById('img-input');
const preview = document.getElementById('profilePreview');
const msg = document.getElementById('msg');
const uploadBox = document.getElementById('uploadBox');
const changeBtn = document.getElementById('changeBtn');
const modal = document.getElementById('modal');
const modalImg = document.getElementById('modalImage');

imgInput.addEventListener('change', function () {
  const file = this.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      preview.src = e.target.result;
      preview.classList.remove('hide');
      uploadBox.classList.add('hide');
      changeBtn.classList.remove('hide');
      msg.textContent = "Click to change profile picture";
    };
    reader.readAsDataURL(file);
  }
});

preview.addEventListener('click', function () {
  modalImg.src = preview.src;
  modal.classList.remove('hide');
});

function closeModal() {
  modal.classList.add('hide');
}
function openPasswordModal() {
  document.getElementById('passwordModal').classList.remove('hide');
}

function closePasswordModal() {
  document.getElementById('passwordModal').classList.add('hide');
}

