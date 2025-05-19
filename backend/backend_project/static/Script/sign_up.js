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

  const username = usernameInput.value.trim();
  const fullName = nameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const confirmPassword = confirmPasswordInput.value;

  let hasError = false;

  // Validate inputs
  if (username === '') {
    setError(usernameInput, usernameError, 'Username is required');
    hasError = true;
  }
  if (fullName === '') {
    setError(nameInput, nameError, 'Full name is required');
    hasError = true;
  }
  if (email === '') {
    setError(emailInput, emailError, 'Email is required');
    hasError = true;
  }
  if (password === '') {
    setError(passwordInput, passwordError, 'Password is required');
    hasError = true;
  }
  if (password !== confirmPassword) {
    setError(confirmPasswordInput, confirmPasswordError, 'Passwords do not match');
    hasError = true;
  }

  if (hasError) {
    return;
  }

  // Submit the form to the backend
  fetch(signupForm.action, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
    },

    body: new URLSearchParams({
      username,
      fullName,
      user_email: email,
      password,
      'pass-confirm': confirmPassword,
    }),

  })
    .then((response) => {
      if (response.ok) {
        window.location.href = '/sign-in';
      } else {
        return response.json();
      }
    })
    .then((data) => {
      if (data && data.error) {
        alert(data.error); // Display error from the backend
      }
    })
    .catch((error) => {
      console.error('Error:', error);
      alert('An error occurred. Please try again.');
    });
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
    [confirmPasswordInput, confirmPasswordError],
  ];

  inputErrorPairs.forEach(([input, error]) => {
    if (input) input.parentElement.classList.remove('incorrect');
    if (error) error.innerText = '';
  });
}
