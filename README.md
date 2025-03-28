# Online Library Website

## 📌 Project Description

An **Online Library Website** that allows users to **search, view, and borrow books**. The system supports **two types of users:**

1. **Admin** - Can manage books (add, edit, delete, view available books).
2. **User** - Can search for books, view book details, and borrow available books.

This project is built using **pure HTML, CSS, JavaScript (Frontend), and Python with Django (Backend)**.

---

## 📁 Folder Structure

```
online-library/
│── backend/              # Backend (Python + Django)
│   ├── library/          # Django project folder
│   ├── books/            # Books app (handles book management)
│   ├── users/            # Users app (handles authentication & roles)
│   ├── templates/        # HTML templates (for Django rendering)
│   ├── static/           # Static files (CSS, JS, images)
│   ├── db.sqlite3        # SQLite database (default for Django)
│   ├── manage.py         # Django management script
│── frontend/             # Frontend (Pure HTML, CSS, JS)
│   ├── css/              # Stylesheets
│   │   ├── styles.css    # Main styles
│   ├── js/               # JavaScript files (AJAX, DOM manipulation)
│   │   ├── auth.js       # Login & registration scripts
│   │   ├── books.js      # Fetch and display books
│   │   ├── borrow.js     # Borrowing functionality
│   │   ├── admin.js      # Admin panel scripts
│   ├── images/           # Book covers, icons
│   ├── index.html        # Home page
│   ├── books.html        # Book listing & search
│   ├── book-details.html # Individual book details
│   ├── login.html        # Login form
│   ├── register.html     # User registration
│   ├── dashboard.html    # User dashboard (borrowed books)
│   ├── admin.html        # Admin panel (add/edit/delete books)
│   ├── borrowed.html     # Borrowed books list
│── database/             # Database (Django ORM - SQL)
│── README.md             # Documentation
```

---

## ⚙️ Features

### ✅ **Admin Functionalities**

- Sign up & Login.
- Add new books.
- View list of available books.
- Edit book details.
- Delete books.

### ✅ **User Functionalities**

- Sign up & Login.
- Search for books by **title, author, or category**.
- View book details.
- Borrow books (if available).
- View list of borrowed books.

### ✅ **General Features**

- Dynamic **Navigation Bar** based on user role.
- Book availability status (Available/Not Available).
- Clean UI and responsive design.

---

## 🔧 Installation & Setup

### **1️⃣ Clone the Repository**

```sh
git clone https://github.com/Amr-Khaled-Ahmed/Online-Library-website.git
cd Online-Library-website
```

### **2️⃣ Install Backend Dependencies**

```sh
cd backend
pip install -r requirements.txt
```

### **3️⃣ Apply Migrations & Start Django Server**

```sh
python manage.py migrate
python manage.py runserver
```

### **4️⃣ Open the Frontend in Browser**

- Navigate to `frontend/index.html` and open it in a browser.

---

## 🛠 Technologies Used

- **Frontend:** HTML, CSS, JavaScript (Vanilla JS, no frameworks)
- **Backend:** Python, Django
- **Database:** SQLite / PostgreSQL (Django ORM)
- **Authentication:** Django Authentication System

---

## 📌 To-Do List

- [ ] Implement book borrowing history.
- [ ] Add book return functionality.
- [ ] Improve UI with better styling.
- [ ] Add email notifications for borrowed books.

---

## 📜 License

This project is **licensed under the Apache License 2.0**.

---

## 🔒 Contribution Policy

This repository is **not open for public contributions**. Only team members are allowed to work on it. If you are a team member, please use a branch-based workflow for modifications.

---
