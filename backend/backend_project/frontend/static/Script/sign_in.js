const signinForm = document.getElementById('form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');

const usernameError = document.getElementById('username-error');
const passwordError = document.getElementById('password-error');

signinForm.addEventListener('submit', (e) => {
  e.preventDefault();
  clearAllErrors();

  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  let hasError = false;

  if (username === '') {
    setError(usernameInput, usernameError, 'Username is required');
    hasError = true;
  }
  if (password === '') {
    setError(passwordInput, passwordError, 'Password is required');
    hasError = true;
  }

  if (hasError) {
    return;
  }

  fetch(signinForm.action, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
    },
    body: new URLSearchParams({
      username_or_email: username,
      password,
    }),
  })
    .then((response) => {
      if (response.ok) {
        window.location.href = '/user-dashboard';
      } else {
        return response.json();
      }
    })
    .then((data) => {
      if (data && data.error) {
        alert(data.error);
      }
    })
    .catch((error) => {
      console.error('Error:', error);
      alert('An error occurred. Please try again.');
    });
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

usernameInput.addEventListener('input', () => {
  usernameInput.parentElement.classList.remove('incorrect');
  usernameError.innerText = '';
});

passwordInput.addEventListener('input', () => {
  passwordInput.parentElement.classList.remove('incorrect');
  passwordError.innerText = '';
});const signinForm = document.getElementById('form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');

const usernameError = document.getElementById('username-error');
const passwordError = document.getElementById('password-error');

signinForm.addEventListener('submit', (e) => {
  e.preventDefault();
  clearAllErrors();

  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  let hasError = false;

  if (username === '') {
    setError(usernameInput, usernameError, 'Username is required');
    hasError = true;
  }
  if (password === '') {
    setError(passwordInput, passwordError, 'Password is required');
    hasError = true;
  }

  if (hasError) {
    return;
  }

  fetch(signinForm.action, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
    },
    body: new URLSearchParams({
      username_or_email: username,
      password,
    }),
  })
    .then((response) => {
      if (response.ok) {
        window.location.href = '/user-dashboard';
      } else {
        return response.json();
      }
    })
    .then((data) => {
      if (data && data.error) {
        alert(data.error);
      }
    })
    .catch((error) => {
      console.error('Error:', error);
      alert('An error occurred. Please try again.');
    });
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

usernameInput.addEventListener('input', () => {
  usernameInput.parentElement.classList.remove('incorrect');
  usernameError.innerText = '';
});

passwordInput.addEventListener('input', () => {
  passwordInput.parentElement.classList.remove('incorrect');
  passwordError.innerText = '';
});