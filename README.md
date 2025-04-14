# Online Library Website

## 📌 Project Description

An **Online Library Website** that allows users to **search, view, and borrow books**. The system supports **two types of users:**

1. **Admin** - Can manage books (add, edit, delete, view available books).
2. **User** - Can search for books, view book details, and borrow available books.

This project is built using **pure HTML, CSS, JavaScript (Frontend), and Python with Django (Backend)**.

---

## 📁 Folder Structure

```
D:.
|   index.html
|   LICENSE
|   README.md
|
\---frontend
    +---CSS
    |   |   add_edit.css
    |   |   admin_dashboard.css
    |   |   books.css
    |   |   book_details.css
    |   |   borrowed.css
    |   |   footer.css
    |   |   forms-style.css
    |   |   header.css
    |   |   index.css
    |   |   user_dashboard.css
    |   |   _variables.css
    |   |
    |   \---assets
    |           book1.jpeg
    |           book2.jpeg
    |           book3.jpeg
    |           book4.jpeg
    |           book5.jpeg
    |           book_cover.jpg
    |           ChildOfTheKindred_ebook1.jpg
    |           ChildOfTheKindred_ebook1.png
    |           crime-and-mystery-cover-scaled-1.jpeg
    |           enceladus.jpg
    |           friend1.jpeg
    |           friend2.jpeg
    |           friend3.jpeg
    |           friend4.jpeg
    |           man-reading-design.png
    |           online-education.gif
    |           woman-reading-chair.png
    |
    \---pages
        |   add_edit.html
        |   admin_dashboard.html
        |   books.html
        |   book_details.html
        |   borrowed.html
        |   footer.html
        |   header.html
        |   sign-in.html
        |   sign-up.html
        |   user_dashboard.html
    |
    \---Script
        |   add_edit.js
        |   admin_dashboard.js
        |   books.js
        |   book_details.js
        |   borrowed.js
        |   footer.js
        |   header.js
        |   sign-in.js
        |   sign-up.js
        |   user_dashboard.js
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
