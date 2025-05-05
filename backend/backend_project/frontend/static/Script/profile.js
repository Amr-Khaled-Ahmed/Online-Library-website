const imgInput = document.getElementById('img-input');
const preview = document.getElementById('profilePreview');
const msg = document.getElementById('msg');
const uploadBox = document.getElementById('uploadBox');
const profileActions = document.getElementById('profileActions');
const modal = document.getElementById('modal');
const modalImg = document.getElementById('modalImage');

// Profile Info Elements
const username = document.getElementById('username');
const fullName = document.getElementById('fullName');
const email = document.getElementById('email');
const userType = document.getElementById('userType');
const bio = document.getElementById('bio');
const booksBorrowed = document.getElementById('booksBorrowed');
const booksFavorited = document.getElementById('booksFavorited');
const memberSince = document.getElementById('memberSince');

// Load logged in user
let loggedInUser = JSON.parse(localStorage.getItem('loggedIn_user'));

// Keep just logged in user in users data
// let usersData = JSON.parse(localStorage.getItem('users_data'));
// usersData = usersData.filter(u => u.username == loggedInUser.username);
// localStorage.setItem('users_data',JSON.stringify(usersData));

// Initialize profile page
function loadUserData() {
  if (!loggedInUser) {
    window.location.href = 'sign-in.html';
    return;
  }

  // Set user data
  username.value = loggedInUser.username || '';
  fullName.value = loggedInUser.fullName || '';
  email.value = loggedInUser.email || '';
  userType.value = loggedInUser.role === 'admin' ? 'Admin' : 'User';
  bio.value = loggedInUser.bio || '';
  booksBorrowed.textContent = loggedInUser.borrowed_books?.length || 0;
  booksFavorited.textContent = loggedInUser.favorite_books?.length || 0;
  const book_maximized = document.querySelector('a[href="./books.html"]');
  const book_minimized = document.querySelector('.mobile-nav a[href="./books.html"]');
   if (loggedInUser.role === 'admin') {
    booksBorrowed.parentElement.style.display = 'none';
    booksFavorited.parentElement.style.display = 'none';
    book_maximized.style.display = 'none';
    book_minimized.style.display = 'none';
  }
  
  // Set member since date
  if (loggedInUser.memberSince) {
    const date = new Date(loggedInUser.memberSince);
    memberSince.textContent = date.getFullYear();
  } else {
    memberSince.textContent = new Date().getFullYear();
  }

  // Set profile picture
  if (loggedInUser.profilePicture) {
    preview.src = loggedInUser.profilePicture;
    preview.classList.remove('hide');
    uploadBox.classList.add('hide');
    profileActions.classList.remove('hide');
    msg.textContent = "Click to change profile picture";
  } else {
    preview.src = '';
    preview.classList.add('hide');
    uploadBox.classList.remove('hide');
    profileActions.classList.add('hide');
    msg.textContent = "Click to upload profile picture";
  }
}

// Initialize page
loadUserData();

// Update attribute in borrowed books
function editAttrBrl(attribute, newValue) {
  const booksID = loggedInUser.borrowed_books.map(b => {
    return b.id;
  });
  const books = JSON.parse(localStorage.getItem('books'));
  books.forEach(b => {
    if(booksID.includes(b.id)) {
      b.borrowersList.forEach(u => {
        if(u.username == loggedInUser.username) {
          u[attribute] = newValue;
        }
      });
    }
  });
  localStorage.setItem('books', JSON.stringify(books));
}

// Profile picture upload
imgInput.addEventListener('change', function() {
  const file = this.files[0];
  if (!file) return;

  // Validate file
  const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
  const maxSize = 2 * 1024 * 1024; // 2MB
  
  if (!validTypes.includes(file.type)) {
    alert('Please select a valid image file (JPEG, PNG, GIF)');
    return;
  }
  
  if (file.size > maxSize) {
    alert('Image size should not exceed 2MB');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    // Update the logged in user's profile picture
    loggedInUser.profilePicture = e.target.result;
    localStorage.setItem('loggedIn_user', JSON.stringify(loggedInUser));

    // Update profile picture in borrowed books
    editAttrBrl('profilePic', e.target.result);
    
    // Update the users_data array
    const usersData = JSON.parse(localStorage.getItem('users_data') || '[]');
    const updatedUsers = usersData.map(user => {
      if (user.username === loggedInUser.username) {
        user.profilePicture = e.target.result;
      }
      return user;
    });
    
    localStorage.setItem('users_data', JSON.stringify(updatedUsers));
    
    // Update UI
    preview.src = e.target.result;
    preview.classList.remove('hide');
    uploadBox.classList.add('hide');
    profileActions.classList.remove('hide');
    msg.textContent = "Click to change profile picture";
  };
  reader.readAsDataURL(file);
});

// Preview profile picture in modal
preview.addEventListener('click', function() {
  if (loggedInUser.profilePicture) {
    modalImg.src = preview.src;
    modal.classList.remove('hide');
  }
});

function closeModal() {
  modal.classList.add('hide');
}

function removeProfilePicture() {
  // Remove profile picture from logged in user
  delete loggedInUser.profilePicture;
  localStorage.setItem('loggedIn_user', JSON.stringify(loggedInUser));

  // Update profile picture in borrowed books
  editAttrBrl('profilePic', './../CSS/assets/blue.avif');

  // Remove from users_data
  const usersData = JSON.parse(localStorage.getItem('users_data') || '[]');
  const updatedUsers = usersData.map(user => {
    if (user.username === loggedInUser.username) {
      delete user.profilePicture;
    }
    return user;
  });
  
  localStorage.setItem('users_data', JSON.stringify(updatedUsers));
  
  // Update UI
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
  // Clear any previous errors
  document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
  document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
}

function updatePassword() {
  const usersData = JSON.parse(localStorage.getItem('users_data') || []);
  const loggedInUser = JSON.parse(localStorage.getItem('loggedIn_user'));

  const currentPassword = document.getElementById('currentPassword').value.trim();
  const newPassword = document.getElementById('newPassword').value.trim();
  const confirmPassword = document.getElementById('confirmPassword').value.trim();

  // Clear previous errors
  document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
  document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));

  let hasError = false;

  // Validate current password
  if (currentPassword === '') {
    setError(document.getElementById('currentPassword'), 'Current password is required');
    hasError = true;
  } else if (currentPassword !== loggedInUser.password) {
    setError(document.getElementById('currentPassword'), 'Current password is incorrect');
    hasError = true;
  }

  // Validate new password
  if (newPassword === '') {
    setError(document.getElementById('newPassword'), 'New password is required');
    hasError = true;
  } else {
    if (newPassword.length < 8) {
      setError(document.getElementById('newPassword'), 'Password must have at least 8 characters');
      hasError = true;
    }
    if (!/[A-Z]/.test(newPassword)) {
      setError(document.getElementById('newPassword'), 'Password must include at least one uppercase letter');
      hasError = true;
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      setError(document.getElementById('newPassword'), 'Password must include at least one special character');
      hasError = true;
    }
    if (newPassword === currentPassword) {
      setError(document.getElementById('newPassword'), 'New password must be different from current password');
      hasError = true;
    }
  }

  
  // Validate confirm password
  if (confirmPassword === '') {
    setError(document.getElementById('confirmPassword'), 'Please confirm your new password');
    hasError = true;
  } else if (newPassword !== confirmPassword) {
    setError(document.getElementById('confirmPassword'), 'Passwords do not match');
    hasError = true;
  }

  if (hasError) {
    return;
  }

  // Update password for the logged-in user
  const updatedUsers = usersData.map(user => {
    if (user.username === loggedInUser.username) {
      user.password = newPassword;
      // Update local session
      loggedInUser.password = newPassword;
      localStorage.setItem('loggedIn_user', JSON.stringify(loggedInUser));
    }
    return user;
  });

  localStorage.setItem('users_data', JSON.stringify(updatedUsers));
  
  // Show success message
  const successMessage = document.createElement('div');
  successMessage.className = 'success-message';
  successMessage.innerHTML = '<i class="fas fa-check-circle"></i> Password updated successfully!';
  document.querySelector('.modal-buttons').before(successMessage);
  
  // Clear fields and hide modal after delay
  setTimeout(() => {
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
    document.querySelector('.success-message')?.remove();
    closePasswordModal();
  }, 2000);
}

function setError(input, message) {
  input.classList.add('error');
  const errorElement = document.createElement('div');
  errorElement.className = 'error-message';
  errorElement.textContent = message;
  errorElement.style.color = 'var(--error-color)';
  errorElement.style.marginTop = '5px';
  errorElement.style.fontSize = '0.8rem';
  
  // Insert error message after the input
  input.parentNode.insertBefore(errorElement, input.nextSibling);
}

function closePasswordModal() {
  document.getElementById('passwordModal').classList.add('hide');
  document.getElementById('currentPassword').value = '';
  document.getElementById('newPassword').value = '';
  document.getElementById('confirmPassword').value = '';
  // Clear any error messages
  document.querySelectorAll('.error-message').forEach(el => el.remove());
  document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
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
  
  const loggedInUser = JSON.parse(localStorage.getItem('loggedIn_user'));
  if (password !== loggedInUser.password) {
    alert('Incorrect password. Please try again.');
    return;
  }

  // Remove user from borrowers lists
  const books = JSON.parse(localStorage.getItem('books'));
  books.forEach(b => {
      b.borrowersList = b.borrowersList.filter(u => u.username !== loggedInUser.username);
      b.borrowNum = String(b.borrowersList.length);
  });
  localStorage.setItem('books', JSON.stringify(books));
  
  // Remove user from users_data
  const usersData = JSON.parse(localStorage.getItem('users_data') || []);
  const updatedUsers = usersData.filter(user => user.username !== loggedInUser.username);
  localStorage.setItem('users_data', JSON.stringify(updatedUsers));
  
  // Remove loggedIn_user
  localStorage.removeItem('loggedIn_user');
  
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
  
  // Add event listener for Enter key to save changes
  field.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      saveField(fieldId);
    }
  });
  
  // Add blur event to save when focus is lost
  field.addEventListener('blur', function() {
    saveField(fieldId);
  });
}

function saveField(fieldId) {
  const field = document.getElementById(fieldId);
  const newValue = field.value.trim();
  const loggedInUser = JSON.parse(localStorage.getItem('loggedIn_user'));

  if (newValue === '') {
    alert('Field cannot be empty');
    return;
  }
  
  // Special validation for email
  if (fieldId === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newValue)) {
    alert('Please enter a valid email address');
    return;
  }
  
  // Check if username is already taken (except for current user)
  if (fieldId === 'username') {
    const usersData = JSON.parse(localStorage.getItem('users_data') || []);
    const usernameTaken = usersData.some(user => 
      user.username === newValue && user.username !== loggedInUser.username
    );
    
    if (usernameTaken) {
      alert('Username is already taken');
      return;
    }
  }
  
  // Update localStorage
  const usersData = JSON.parse(localStorage.getItem('users_data') || []);
  
  
  const updatedUsers = usersData.map(user => {
    if (user.username === loggedInUser.username) {

      // Update username, email in borrowed books
      if(fieldId == 'email' || fieldId == 'username') {
        editAttrBrl(fieldId, newValue);
      }

      user[fieldId === 'fullName' ? 'fullName' : fieldId] = newValue;
      loggedInUser[fieldId === 'fullName' ? 'fullName' : fieldId] = newValue;
      localStorage.setItem('loggedIn_user', JSON.stringify(loggedInUser));
    }
    return user;
  });
  
  localStorage.setItem('users_data', JSON.stringify(updatedUsers));
  
  // Reset field state
  field.readOnly = true;
  field.style.cursor = 'default';
  field.style.opacity = '0.8';
}

// Password strength indicator
document.getElementById('newPassword').addEventListener('input', function() {
  const strengthBars = document.querySelectorAll('.strength-bar');
  const strengthText = document.querySelector('.strength-text');
  const password = this.value;
  
  // Clear previous error messages
  const existingError = this.nextElementSibling;
  if (existingError && existingError.classList.contains('error-message')) {
    existingError.remove();
  }
  
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
  
  // Update user data in localStorage
  const usersData = JSON.parse(localStorage.getItem('users_data') || []);
  const loggedInUser = JSON.parse(localStorage.getItem('loggedIn_user'));
  
  const updatedUsers = usersData.map(user => {
    if (user.username === loggedInUser.username) {
      user.fullName = document.getElementById('fullName').value;
      user.bio = document.getElementById('bio').value;
      // Update theme preferences if needed
    }
    return user;
  });
  
  localStorage.setItem('users_data', JSON.stringify(updatedUsers));
  
  // Update loggedIn_user
  loggedInUser.fullName = document.getElementById('fullName').value;
  loggedInUser.bio = document.getElementById('bio').value;
  localStorage.setItem('loggedIn_user', JSON.stringify(loggedInUser));
  
  alert('Profile changes saved successfully!');
});

document.addEventListener('DOMContentLoaded', function () {
  const loggedInUser = JSON.parse(localStorage.getItem('loggedIn_user'));

  if (loggedInUser) {
    const adminHiddenLinks = document.querySelectorAll('#AdminHidden');

    // Show or hide links based on user role
    if (loggedInUser.role === 'admin') {
      adminHiddenLinks.forEach(link => link.classList.add('hide'));
    } else {
      adminHiddenLinks.forEach(link => link.classList.remove('hide'));
    }

    // Redirect "Home" link based on user role
    const homeLink = document.getElementById('homeLink');
    const mobileHomeLink = document.getElementById('mobileHomeLink');

    if (loggedInUser.role === 'admin') {
      homeLink.href = './admin_dashboard.html';
      mobileHomeLink.href = './admin_dashboard.html';
    } else {
      homeLink.href = './user_dashboard.html';
      mobileHomeLink.href = './user_dashboard.html';
    }
  }
});

document.addEventListener('DOMContentLoaded', function () {
  const loggedInUser = JSON.parse(localStorage.getItem('loggedIn_user'));

  if (loggedInUser) {
    const bookLink = document.getElementById('bookLink');

    if (loggedInUser.role === 'admin') {
      bookLink.href = './admin_dashboard.html#books-container';
    } else {
      bookLink.href = './user_dashboard.html';
    }
  }
});

// redirect profile-links


// Delete edit
window.sessionStorage.removeItem('edit');
window.sessionStorage.removeItem('editedBook');
window.sessionStorage.removeItem('coverPath');
window.sessionStorage.removeItem('description');
