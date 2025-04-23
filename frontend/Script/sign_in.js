const signinForm = document.getElementById('form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');

const usernameError = document.getElementById('username-error');
const passwordError = document.getElementById('password-error');

signinForm.addEventListener('submit', (e) => {
  e.preventDefault();
  clearAllErrors();

  let hasError = false;

  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  if (username === '') {
    setError(usernameInput, usernameError, 'Username is required');
    hasError = true;
  }

  if (password === '') {
    setError(passwordInput, passwordError, 'Password is required');
    hasError = true;
  }

  // Default admin credentials
  const defaultAdmin = {
    username: 'admin',
    password: 'Admin@123456789',
    role: 'admin',
    fullName: 'Admin User',
    email: 'admin@library.com',
    favorite_books: [],
    borrowed_books: [],
    profilePicture: null,
    bio: '',
    memberSince: new Date().toISOString()
  };

  const users = JSON.parse(localStorage.getItem('users_data') || '[]');
  const matchedUser = users.find(u => u.username === username);

  // Check for default admin login
  if (!matchedUser && username === defaultAdmin.username && password === defaultAdmin.password) {
    localStorage.setItem('loggedIn_user', JSON.stringify(defaultAdmin));
    window.location.href = 'admin_dashboard.html';
    return;
  }

  // Validate user exists
  if (!matchedUser) {
    setError(usernameInput, usernameError, 'Username does not exist');
    hasError = true;
  } 
  // Validate password
  else if (matchedUser.password !== password) {
    setError(passwordInput, passwordError, 'Incorrect password');
    hasError = true;
  }

  if (hasError) {
    return;
  }

  // Successful login
  localStorage.setItem('loggedIn_user', JSON.stringify(matchedUser));
  
  // Redirect based on role
  if (matchedUser.role === 'admin') {
    window.location.href = 'admin_dashboard.html';
  } else {
    window.location.href = 'user_dashboard.html';
  }
});

function setError(input, errorElement, message) {
  input.parentElement.classList.add('incorrect');
  errorElement.innerText = message;
}

function clearAllErrors() {
  const inputErrorPairs = [
    [usernameInput, usernameError],
    [passwordInput, passwordError],
  ];

  inputErrorPairs.forEach(([input, error]) => {
    if (input) input.parentElement.classList.remove('incorrect');
    if (error) error.innerText = '';
  });
}

// Clear errors when typing
usernameInput.addEventListener('input', () => {
  usernameInput.parentElement.classList.remove('incorrect');
  usernameError.innerText = '';
});

passwordInput.addEventListener('input', () => {
  passwordInput.parentElement.classList.remove('incorrect');
  passwordError.innerText = '';
});
