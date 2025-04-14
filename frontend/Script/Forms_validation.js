const form = document.getElementById('form');
const usernameInput = document.getElementById('username');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('pass-confirm');

const usernameError = document.getElementById('username-error');
const emailError = document.getElementById('email-error');
const passwordError = document.getElementById('password-error');
const confirmPasswordError = document.getElementById('pass-confirm-error');

form.addEventListener('submit', (e) => {
  clearAllErrors();

  let hasError = false;

  if (emailInput && confirmPasswordInput) {
    if (usernameInput.value === '') {
      setError(usernameInput, usernameError, 'Username is required');
      hasError = true;
    }

    if (emailInput.value === '') {
      setError(emailInput, emailError, 'Email is required');
      hasError = true;
    }

    if (passwordInput.value === '') {
      setError(passwordInput,passwordError,'Password is required')
    } else {
      if (passwordInput.value < 8) {
        setError(passwordInput,passwordError,'Password must have at least 8 characters')
      }
    
      if(!/[A-Z]/.test(passwordInput.value) && !/[!@#$%^&*(),.?":{}|<>]/.test(passwordInput.value)){
          setError(passwordInput,passwordError,'Password must include at least one special character and one uppercase letter')
      }
      else{
        if (!/[A-Z]/.test(passwordInput.value) ) {
          setError(passwordInput,passwordError,'Password must include at least one uppercase letter')
        }
      
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(passwordInput.value)) {
          setError(passwordInput,passwordError,'Password must include at least one special character')
        }
      }
      
    }

    if (passwordInput.value !== confirmPasswordInput.value) {
      setError(confirmPasswordInput, confirmPasswordError, 'Password does not match');
      hasError = true;
    }

  } else {
    // Sign-In Form Logic
    if (usernameInput.value === '') {
      setError(usernameInput, usernameError, 'Username is required');
      hasError = true;
    }

    if (passwordInput.value === '') {
      setError(passwordInput, passwordError, 'Password is required');
      hasError = true;
    }
  }

  if (hasError) {
    e.preventDefault(); // Stop form submission
  }
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
