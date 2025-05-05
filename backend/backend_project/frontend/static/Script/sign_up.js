const signupForm = document.getElementById('form');
const usernameInput = document.getElementById('username');
const nameInput = document.getElementById('fullName');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('pass-confirm');

const usernameError = document.getElementById('username-error');
const nameError = document.getElementById('name-error');
const emailError = document.getElementById('email-error');
const passwordError = document.getElementById('password-error');
const confirmPasswordError = document.getElementById('pass-confirm-error');

signupForm.addEventListener('submit', (e) => {
  e.preventDefault();
  clearAllErrors();
  let hasError = false;

  const newUsername = usernameInput.value.trim();
  const newName = nameInput.value.trim();
  const newEmail = emailInput.value.trim();
  const newPassword = passwordInput.value;
  const confirmPassword = confirmPasswordInput.value;

  const existingUsers = JSON.parse(localStorage.getItem('users_data') || '[]');
  const usernameTaken = existingUsers.some(user => user.username === newUsername);
  const emailTaken = existingUsers.some(user => user.email === newEmail);

  // Validate username
  if (newUsername === '') {
    setError(usernameInput, usernameError, 'Username is required');
    hasError = true;
  } else if (usernameTaken) {
    setError(usernameInput, usernameError, 'Username is already taken');
    hasError = true;
  } else if (newUsername.length < 3) {
    setError(usernameInput, usernameError, 'Username must be at least 3 characters');
    hasError = true;
  }

  // Validate full name
  if (newName === '') {
    setError(nameInput, nameError, 'Full name is required');
    hasError = true;
  }

  // Validate email
  if (newEmail === '') {
    setError(emailInput, emailError, 'Email is required');
    hasError = true;
  } else if (!validateEmail(newEmail)) {
    setError(emailInput, emailError, 'Please enter a valid email');
    hasError = true;
  } else if (emailTaken) {
    setError(emailInput, emailError, 'Email is already registered');
    hasError = true;
  }

  // Validate password
  if (newPassword === '') {
    setError(passwordInput, passwordError, 'Password is required');
    hasError = true;
  } else {
    if (newPassword.length < 8) {
      setError(passwordInput, passwordError, 'Password must have at least 8 characters');
      hasError = true;
    }
    if (!/[A-Z]/.test(newPassword)) {
      setError(passwordInput, passwordError, 'Password must include at least one uppercase letter');
      hasError = true;
    }
    if (!/[0-9]/.test(newPassword)) {
      setError(passwordInput, passwordError, 'Password must include at least one number');
      hasError = true;
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      setError(passwordInput, passwordError, 'Password must include at least one special character');
      hasError = true;
    }
  }

  // Validate confirm password
  if (confirmPassword === '') {
    setError(confirmPasswordInput, confirmPasswordError, 'Please confirm your password');
    hasError = true;
  } else if (newPassword !== confirmPassword) {
    setError(confirmPasswordInput, confirmPasswordError, 'Passwords do not match');
    hasError = true;
  }

  if (hasError) {
    return;
  }

  // Create new user object
  const newUser = {
    username: newUsername,
    fullName: newName,
    password: newPassword,
    email: newEmail,
    role: 'user',
    favorite_books: [],
    borrowed_books: [],
    profilePicture: null,
    bio: '',
    memberSince: new Date().toISOString()
  };

  // Update users data
  existingUsers.push(newUser);
  localStorage.setItem('users_data', JSON.stringify(existingUsers));

  // Redirect to sign-in page
  window.location.href = 'sign-in.html';
});

// Helper functions
function setError(input, errorElement, message) {
  input.parentElement.classList.add('incorrect');
  errorElement.innerText = message;
}

function clearAllErrors() {
  const inputErrorPairs = [
    [usernameInput, usernameError],
    [nameInput, nameError],
    [emailInput, emailError],
    [passwordInput, passwordError],
    [confirmPasswordInput, confirmPasswordError]
  ];

  inputErrorPairs.forEach(([input, error]) => {
    if (input) input.parentElement.classList.remove('incorrect');
    if (error) error.innerText = '';
  });
}

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}
const btn = document.getElementById('button');

document.getElementById('form').addEventListener('submit', function(event) {
  event.preventDefault();

  btn.value = 'Sending...';

  const serviceID = 'service_fmvv571'; // Or your custom service ID
  const templateID = 'template_or6zamu';

  emailjs.sendForm(serviceID, templateID, this)
    .then(() => {
      btn.value = 'Send Email';
      alert('✅ Confirmation email sent!');
    }, (err) => {
      btn.value = 'Send Email';
      alert('❌ Failed to send:\n' + JSON.stringify(err));
    });
});
