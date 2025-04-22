// Script/getEnter.js
document.addEventListener('DOMContentLoaded', function() {
    // Check if users exist in localStorage, if not create default ones
    if (!localStorage.getItem('users_data')) {
      const defaultUsers = [
        {
          username: 'admin',
          fullName: 'System Administrator',
          email: 'admin@library.com',
          password: 'Admin@123', // Strong password
          role: 'admin',
          favorite_books: [],
          borrowed_books: []
        },
        {
          username: 'user1',
          fullName: 'Regular User',
          email: 'user1@library.com',
          password: 'User@123', // Strong password
          role: 'user',
          favorite_books: [],
          borrowed_books: []
        }
      ];
      localStorage.setItem('users_data', JSON.stringify(defaultUsers));
    }
  });