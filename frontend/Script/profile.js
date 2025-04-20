const imgInput = document.getElementById('img-input');
const preview = document.getElementById('profilePreview');
const msg = document.getElementById('msg');
const uploadBox = document.getElementById('uploadBox');
const profileActions = document.getElementById('profileActions');
const modal = document.getElementById('modal');
const modalImg = document.getElementById('modalImage');

// Profile picture upload functionality
imgInput.addEventListener('change', function () {
  const file = this.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      preview.src = e.target.result;
      preview.classList.remove('hide');
      uploadBox.classList.add('hide');
      profileActions.classList.remove('hide');
      msg.textContent = "Click to change profile picture";
    };
    reader.readAsDataURL(file);
  }
});

// Preview profile picture in modal
preview.addEventListener('click', function () {
  modalImg.src = preview.src;
  modal.classList.remove('hide');
});

function closeModal() {
  modal.classList.add('hide');
}

function removeProfilePicture() {
  preview.src = '';
  preview.classList.add('hide');
  uploadBox.classList.remove('hide');
  profileActions.classList.add('hide');
  msg.textContent = "Click to upload profile picture";
  imgInput.value = '';
}

// Password modal functions
function openPasswordModal() {
  document.getElementById('passwordModal').classList.remove('hide');
}

function closePasswordModal() {
  document.getElementById('passwordModal').classList.add('hide');
  document.getElementById('currentPassword').value = '';
  document.getElementById('newPassword').value = '';
  document.getElementById('confirmPassword').value = '';
}

function togglePasswordVisibility(fieldId, iconElement) {
  const field = document.getElementById(fieldId);
  if (field.type === 'password') {
    field.type = 'text';
    iconElement.classList.replace('fa-eye', 'fa-eye-slash');
  } else {
    field.type = 'password';
    iconElement.classList.replace('fa-eye-slash', 'fa-eye');
  }
}

// Delete account functionality
function confirmDeleteAccount() {
  document.getElementById('deleteModal').classList.remove('hide');
}

function closeDeleteModal() {
  document.getElementById('deleteModal').classList.add('hide');
  document.getElementById('deletePassword').value = '';
}

function deleteAccount() {
  const password = document.getElementById('deletePassword').value.trim();
  
  if (!password) {
    alert('Please enter your password to confirm account deletion.');
    return;
  }
  
  console.log('Account deletion requested with password:', password);
  alert('Your account has been deleted successfully. You will be redirected to the home page.');
  
  setTimeout(() => {
    window.location.href = './../../index.html';
  }, 1500);
}

// Form edit functionality
function enableEdit(fieldId) {
  const field = document.getElementById(fieldId);
  field.readOnly = false;
  field.focus();
  field.style.cursor = 'text';
  field.style.opacity = '1';
}

// Password strength indicator
document.getElementById('newPassword').addEventListener('input', function() {
  const strengthBars = document.querySelectorAll('.strength-bar');
  const strengthText = document.querySelector('.strength-text');
  const password = this.value;
  
  strengthBars.forEach(bar => bar.style.backgroundColor = 'var(--border-color)');
  
  if (password.length === 0) {
    strengthText.textContent = 'Password strength';
    return;
  }
  
  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;
  
  for (let i = 0; i < strength; i++) {
    strengthBars[i].style.backgroundColor = i < 2 ? '#ff5555' : i === 2 ? '#ffb86c' : '#50fa7b';
  }
  
  strengthText.textContent = 
    strength < 2 ? 'Weak' : 
    strength === 2 ? 'Medium' : 
    strength === 3 ? 'Strong' : 'Very strong';
});

// Form submission
document.querySelector('.profile-form').addEventListener('submit', function(e) {
  e.preventDefault();
  alert('Profile changes saved successfully!');
});