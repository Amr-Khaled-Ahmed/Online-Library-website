const login = document.getElementById('login-link');
const sign_up = document.getElementById('register-link');
const navBar = document.querySelector('.nav-bar');

const loggedInUser = JSON.parse(window.localStorage.getItem('loggedIn_user'));

if (loggedInUser && navBar) {
  if (login) login.parentElement.remove();
  if (sign_up) sign_up.parentElement.remove();

  const profileLi = document.createElement('li');
  profileLi.innerHTML = `
    <a href="./frontend/pages/profile.html"><i class="fas fa-user"></i> Profile</a>
  `;

  const dashboardLi = document.createElement('li');
  dashboardLi.innerHTML = `
    <a href="./frontend/pages/user_dashboard.html"><i class="fas fa-tachometer-alt"></i> Dashboard</a>
  `;

  const logoutLi = document.createElement('li');
  const logoutLink = document.createElement('a');
  logoutLink.href = "#";
  logoutLink.innerHTML = `<i class="fas fa-sign-out-alt"></i> Logout`;
  logoutLink.addEventListener('click', () => {
    window.localStorage.removeItem('loggedIn_user');
    window.location.reload(); // or redirect to homepage
  });

  logoutLi.appendChild(logoutLink);

  navBar.appendChild(profileLi);
  navBar.appendChild(dashboardLi);
  navBar.appendChild(logoutLi);
}

// Delete edit
window.sessionStorage.removeItem('edit');
window.sessionStorage.removeItem('editedBook');
window.sessionStorage.removeItem('coverPath');
window.sessionStorage.removeItem('description');