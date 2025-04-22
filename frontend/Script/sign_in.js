const signinForm = document.getElementById('form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');

const usernameError = document.getElementById('username-error');
const passwordError = document.getElementById('password-error');

signinForm.addEventListener('submit', (e) => {
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
    borrowed_books: []
  };

  const users = JSON.parse(localStorage.getItem('users_data') || '[]');
  const matchedUser = users.find(u => u.username === username);

  if (!matchedUser && username === defaultAdmin.username && password === defaultAdmin.password) {
    // Allow direct access for the default admin
    window.localStorage.setItem('loggedIn_user', JSON.stringify(defaultAdmin));
    console.log('Logged in as default admin:', defaultAdmin);
    e.preventDefault();
    window.location.href = '/frontend/pages/admin_dashboard.html';
    return;
  }

  if (!matchedUser) {
    setError(usernameInput, usernameError, 'Username does not exist');
    hasError = true;
  } else if (matchedUser.password !== password) {
    setError(passwordInput, passwordError, 'Incorrect password');
    hasError = true;
  } else {
    window.localStorage.setItem('loggedIn_user', JSON.stringify(matchedUser));
    console.log('Logged in user:', matchedUser);
  }

  if (hasError) {
    e.preventDefault();
    return;
  } else {
    e.preventDefault();
    // Navigate based on role
    if (matchedUser.role === 'admin') {
      window.location.href = '/frontend/pages/admin_dashboard.html';
    } else {
      window.location.href = '/frontend/pages/user_dashboard.html';
    }
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

const allInputs = [usernameInput, passwordInput];
const allErrors = [usernameError, passwordError];

allInputs.forEach((input, index) => {
  input.addEventListener('input', () => {
    input.parentElement.classList.remove('incorrect');
    if (allErrors[index]) allErrors[index].innerText = '';
  });
});
