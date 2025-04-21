const signupForm = document.getElementById('form');
const usernameInput = document.getElementById('username');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('pass-confirm');

const usernameError = document.getElementById('username-error');
const emailError = document.getElementById('email-error');
const passwordError = document.getElementById('password-error');
const confirmPasswordError = document.getElementById('pass-confirm-error');

signupForm.addEventListener('submit', (e) => {
  clearAllErrors();
  let hasError = false;

  const newUsername = usernameInput.value;
  const newEmail = emailInput.value;
  const newPassword = passwordInput.value;
  const confirmPassword = confirmPasswordInput.value;

  let existingUsers = [];
  const saved = localStorage.getItem('users_data');
  existingUsers = saved ? JSON.parse(saved) : [];

  const usernameTaken = existingUsers.some(user => user.username === newUsername);
  const emailTaken = existingUsers.some(user => user.email === newEmail);

  if (newUsername === '') {
    setError(usernameInput, usernameError, 'Username is required');
    hasError = true;
  } else if (usernameTaken) {
    setError(usernameInput, usernameError, 'Username is already taken');
    hasError = true;
  }

  if (newEmail === '') {
    setError(emailInput, emailError, 'Email is required');
    hasError = true;
  } else if (emailTaken) {
    setError(emailInput, emailError, 'Email is already registered');
    hasError = true;
  }

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
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      setError(passwordInput, passwordError, 'Password must include at least one special character');
      hasError = true;
    }
  }

  if (newPassword !== confirmPassword) {
    setError(confirmPasswordInput, confirmPasswordError, 'Password does not match');
    hasError = true;
  }

  if (hasError) {
    e.preventDefault();
    return;
  }
  else{
      e.preventDefault();
      window.location.href = 'sign-in.html';
  }


  e.preventDefault();
  const newUser = {
    username: newUsername,
    password: newPassword,
    email: newEmail,
  };

  existingUsers.push(newUser);
  localStorage.setItem('users_data', JSON.stringify(existingUsers));

  console.log('All users:', existingUsers);
  signupForm.reset();
});

function setError(input, errorElement, message) {
  input.parentElement.classList.add('incorrect');
  errorElement.innerText = message;
}

function clearAllErrors() {
  const inputErrorPairs = [
    [usernameInput, usernameError],
    [emailInput, emailError],
    [passwordInput, passwordError],
    [confirmPasswordInput, confirmPasswordError],
  ];

  inputErrorPairs.forEach(([input, error]) => {
    if (input) input.parentElement.classList.remove('incorrect');
    if (error) error.innerText = '';
  });
}

const allInputs = [usernameInput, emailInput, passwordInput, confirmPasswordInput].filter(Boolean);
const allErrors = [usernameError, emailError, passwordError, confirmPasswordError];

allInputs.forEach((input, index) => {
  input.addEventListener('input', () => {
    input.parentElement.classList.remove('incorrect');
    if (allErrors[index]) allErrors[index].innerText = '';
  });
});
