import sqlite3
from datetime import datetime, timedelta
import hashlib
import os
import re
from contextlib import contextmanager

class LibraryAPI:
    def __init__(self, db_path):
        self.db_path = db_path
        
    @contextmanager
    def get_db(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
        except Exception as e:
            conn.rollback()
            raise e
        else:
            conn.commit()
        finally:
            conn.close()

    def _validate_username(self, username): 
        return bool(re.match(r'^[a-zA-Z0-9]+$', username))

    def _validate_email(self, email):
        return bool(re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email))

    def create_user(self, username, email, password, first_name, last_name):
        if not self._validate_username(username):
            raise ValueError("Username must contain only letters and numbers")
        if not self._validate_email(email):
            raise ValueError("Invalid email format")

        with self.get_db() as conn:
            cursor = conn.cursor()
            password_hash = self._hash_password(password)
            cursor.execute(
                """INSERT INTO Users (
                    username, email, first_name, last_name, 
                    role, is_a_member, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)""",
                (username, email, first_name, last_name, 0, 0)
            )
            user_id = cursor.lastrowid
            cursor.execute(
                "INSERT INTO Credentials (user_id, password_hash) VALUES (?, ?)",
                (user_id, password_hash)
            )
            return user_id
        
    def _hash_password(self, password):
        return hashlib.sha256(password.encode('utf-8')).digest()
    
    def _verify_password(self, password, stored_hash):
        return hashlib.sha256(password.encode('utf-8')).digest() == stored_hash
    
    def authenticate_user(self, username_or_email, password):
        with self.get_db() as conn:
            cursor = conn.cursor()
            query_field = "email" if '@' in username_or_email else "username"
            cursor.execute(
                f"SELECT u.user_id, c.password_hash FROM Users u "
                f"JOIN Credentials c ON u.user_id = c.user_id WHERE u.{query_field} = ?",
                (username_or_email,)
            )
            user = cursor.fetchone()
            if not user or not self._verify_password(password, user['password_hash']):
                return None
                
            # Update last login - triggers check for membership expiration
            cursor.execute(
                "UPDATE Users SET last_login = CURRENT_TIMESTAMP, last_seen = CURRENT_TIMESTAMP WHERE user_id = ?",
                (user['user_id'],)
            )
            return user['user_id']
    
    def update_profile(self, user_id, **profile_data):
        allowed_fields = ['first_name', 'last_name', 'bio', 'theme_preference', 
                         'is_subbed_to_newsletter', 'profile_image_url']
        
        updates = {k: v for k, v in profile_data.items() if k in allowed_fields}
        if not updates:
            return False
            
        with self.get_db() as conn:
            cursor = conn.cursor()
            query = f"UPDATE Users SET {', '.join(f'{k} = ?' for k in updates)} WHERE user_id = ?"
            params = list(updates.values()) + [user_id]
            cursor.execute(query, params)
            return True
    
    def get_user_profile(self, user_id):
        """Get user profile using UserProfile view"""
        with self.get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM GlobalParameters")
            cursor.execute("INSERT INTO GlobalParameters (user_id) VALUES (?)", (user_id,))
            cursor.execute("SELECT * FROM UserProfile")
            profile = cursor.fetchone()
            return dict(profile) if profile else None
    
    def add_friend(self, user_id, friend_username_or_email):
        """Add a friend by username or email"""
        with self.get_db() as conn:
            cursor = conn.cursor()
            query_field = "email" if '@' in friend_username_or_email else "username"
            cursor.execute(
                f"SELECT user_id FROM Users WHERE {query_field} = ?", 
                (friend_username_or_email,)
            )
            friend = cursor.fetchone()
            if not friend:
                return False, "User not found"
                
            friend_id = friend['user_id']
            if friend_id == user_id:
                return False, "Cannot add yourself as a friend"
                
            user_1_id, user_2_id = min(user_id, friend_id), max(user_id, friend_id)
            
            cursor.execute(
                "SELECT status FROM Friendships WHERE user_1_id = ? AND user_2_id = ?",
                (user_1_id, user_2_id)
            )
            existing = cursor.fetchone()
            
            if existing:
                status = existing['status']
                if status == 'Accepted':
                    return False, "Already friends"
                elif status == 'Requested':
                    return False, "Friend request already sent"
                elif status == 'Rejected':
                    cursor.execute(
                        "UPDATE Friendships SET status = 'Requested', created_at = CURRENT_TIMESTAMP "
                        "WHERE user_1_id = ? AND user_2_id = ?",
                        (user_1_id, user_2_id)
                    )
                    return True, "Friend request sent"
            
            cursor.execute(
                "INSERT INTO Friendships (user_1_id, user_2_id, status) VALUES (?, ?, 'Requested')",
                (user_1_id, user_2_id)
            )
            return True, "Friend request sent"
    
    def add_book(self, title, isbn, publication_year, publisher_name, cover_image_url, 
                 page_count, language, description, authors, genres):
        with self.get_db() as conn:
            cursor = conn.cursor()
            
            # Validate ISBN format
            if not re.match(r'^[0-9-]+$', isbn):
                raise ValueError("ISBN must contain only numbers and hyphens")
                
            cursor.execute("SELECT publisher_id FROM Publisher WHERE name = ?", (publisher_name,))
            publisher = cursor.fetchone()
            publisher_id = publisher['publisher_id'] if publisher else cursor.execute(
                "INSERT INTO Publisher (name) VALUES (?)", (publisher_name,)
            ).lastrowid
            
            cursor.execute(
                """INSERT INTO Books (title, isbn, publication_year, publisher_id, 
                cover_image_url, page_count, language, description)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                (title, isbn, publication_year, publisher_id, cover_image_url, 
                 page_count, language, description)
            )
            book_id = cursor.lastrowid
            
            for author_name in authors:
                cursor.execute("SELECT author_id FROM Authors WHERE name = ?", (author_name,))
                author = cursor.fetchone()
                author_id = author['author_id'] if author else cursor.execute(
                    "INSERT INTO Authors (name) VALUES (?)", (author_name,)
                ).lastrowid
                
                cursor.execute(
                    "INSERT INTO BookAuthor (book_id, author_id) VALUES (?, ?)",
                    (book_id, author_id)
                )
            
            # Get valid genres from the database
            cursor.execute("SELECT name FROM Genres")
            valid_genres = {row['name'] for row in cursor.fetchall()}
            
            for genre_name in genres:
                # Only proceed if genre is in the valid list
                if genre_name in valid_genres:
                    cursor.execute("SELECT genre_id FROM Genres WHERE name = ?", (genre_name,))
                    genre = cursor.fetchone()
                    cursor.execute(
                        "INSERT INTO BookGenre (book_id, genre_id) VALUES (?, ?)",
                        (book_id, genre['genre_id'])
                    )
            
            return book_id

    def add_copy(self, book_id, format):
        """Add a physical copy of a book"""
        if format not in ('Hardcover', 'Paperback'):
            raise ValueError("Only Hardcover and Paperback formats can be added as physical copies")
            
        with self.get_db() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO BookCopies (book_id, format, in_inventory) VALUES (?, ?, 1)",
                (book_id, format)
            )
            return cursor.lastrowid

    def get_available_formats(self, book_id):
        with self.get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT DISTINCT format 
                FROM BookCopies 
                WHERE book_id = ? 
                  AND is_borrowed = 0
                  AND in_inventory = 1
            """, (book_id,))
            physical_formats = [row['format'] for row in cursor.fetchall()]
            return physical_formats + ['E-Book', 'Audiobook']

    def search_books(self, search_query=None, genre=None, sort_by="title", sort_dir="ASC", page=1, page_size=10):
        """Search books using BookList view with filtering and sorting"""
        with self.get_db() as conn:
            cursor = conn.cursor()
            
            where_clauses = []
            params = []
            
            if search_query:
                search_param = f"%{search_query}%"
                where_clauses.append("(title LIKE ? OR authors LIKE ? OR description LIKE ?)")
                params.extend([search_param, search_param, search_param])
            
            if genre:
                where_clauses.append("genres LIKE ?")
                params.append(f"%{genre}%")
            
            query = "SELECT * FROM BookList"
            if where_clauses:
                query += " WHERE " + " AND ".join(where_clauses)
            
            allowed_sort_fields = ["title", "publication_year", "average_rating", "authors", "availability"]
            if sort_by in allowed_sort_fields:
                query += f" ORDER BY {sort_by} {sort_dir}"
            else:
                query += " ORDER BY title ASC"
            
            # Count total results for pagination before applying limits
            count_query = "SELECT COUNT(*) as total FROM BookList"
            if where_clauses:
                count_query += " WHERE " + " AND ".join(where_clauses)
            
            cursor.execute(count_query, params)
            total = cursor.fetchone()['total']
            
            # Add pagination
            query += " LIMIT ? OFFSET ?"
            params.extend([page_size, (page-1)*page_size])
            
            cursor.execute(query, params)
            books = [dict(row) for row in cursor.fetchall()]
            
            return {
                'books': books,
                'total': total,
                'pages': (total + page_size - 1) // page_size
            }
    
    def get_admin_book_dashboard(self, search_query=None, sort_by="title", sort_dir="ASC", page=1, page_size=10):
        """Get admin book dashboard using AdminBookDashboard view"""
        with self.get_db() as conn:
            cursor = conn.cursor()
            
            query = "SELECT * FROM AdminBookDashboard"
            params = []
            
            if search_query:
                search_param = f"%{search_query}%"
                query += " WHERE title LIKE ? OR authors LIKE ? OR isbn LIKE ?"
                params.extend([search_param, search_param, search_param])
            
            allowed_sort_fields = ["title", "publication_year", "average_rating", "total_borrows", "available_copies"]
            if sort_by in allowed_sort_fields:
                query += f" ORDER BY {sort_by} {sort_dir}"
            else:
                query += " ORDER BY title ASC"
            
            # Count total for pagination before applying limits
            count_query = "SELECT COUNT(*) as total FROM AdminBookDashboard"
            if search_query:
                count_query += " WHERE title LIKE ? OR authors LIKE ? OR isbn LIKE ?"
                
            cursor.execute(count_query, params)
            total = cursor.fetchone()['total']
            
            # Add pagination to main query
            query += " LIMIT ? OFFSET ?"
            params.extend([page_size, (page-1)*page_size])
            
            cursor.execute(query, params)
            books = [dict(row) for row in cursor.fetchall()]
            
            return {
                'books': books,
                'total': total,
                'pages': (total + page_size - 1) // page_size
            }
        
    def get_borrowers_by_book_id(self, book_id):
        with self.get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM BookBorrowers WHERE book_id = ?", (book_id,))
            borrowers = cursor.fetchall()
            return [dict(borrower) for borrower in borrowers]
    
    def borrow_book(self, user_id, book_id, format_preference=None):
        try:
            with self.get_db() as conn:
                cursor = conn.cursor()
                
                if format_preference in ('E-Book', 'Audiobook'):
                    # For digital formats, set copy_id to NULL and include book_id
                    cursor.execute(
                        "INSERT INTO Borrowings (user_id, copy_id, book_id, format, borrow_date) VALUES (?, NULL, ?, ?, CURRENT_TIMESTAMP)",
                        (user_id, book_id, format_preference)
                    )
                    return True, "Book borrowed successfully"
                
                # For physical formats, find an available copy
                copy_query = "SELECT copy_id, format FROM BookCopies WHERE book_id = ? AND is_borrowed = 0 AND in_inventory = 1"
                params = [book_id]
                
                if format_preference:
                    copy_query += " AND format = ?"
                    params.append(format_preference)
                
                cursor.execute(copy_query, params)
                copy = cursor.fetchone()
                
                if not copy:
                    return False, "No available copies"
                
                # For physical formats, set book_id to NULL and include copy_id
                cursor.execute(
                    "INSERT INTO Borrowings (user_id, copy_id, book_id, format, borrow_date) VALUES (?, ?, NULL, ?, CURRENT_TIMESTAMP)",
                    (user_id, copy['copy_id'], copy['format'])
                )
                return True, "Book borrowed successfully"
        except sqlite3.IntegrityError as e:
            return False, str(e).split("ABORT: ")[1] if "ABORT: " in str(e) else str(e)
    
    def renew_book(self, user_id, borrowing_id):
        """Renew a borrowed book"""
        try:
            with self.get_db() as conn:
                cursor = conn.cursor()
                
                # Verify borrowing exists and belongs to user
                cursor.execute(
                    "SELECT borrowing_id FROM Borrowings WHERE user_id = ? AND borrowing_id = ? AND return_date IS NULL",
                    (user_id, borrowing_id)
                )
                borrowing = cursor.fetchone()
                
                if not borrowing:
                    return False, "Book not found or not borrowed by you"
                
                # Update renewal count - triggers will validate against limits
                cursor.execute(
                    "UPDATE Borrowings SET current_renew_count = current_renew_count + 1, "
                    "last_renewal_date = CURRENT_TIMESTAMP WHERE borrowing_id = ?",
                    (borrowing['borrowing_id'],)
                )
                return True, "Book renewed successfully"
        except sqlite3.IntegrityError as e:
            # Forward trigger error messages
            return False, str(e).split("ABORT: ")[1] if "ABORT: " in str(e) else str(e)
    
    def return_book(self, user_id, borrowing_id):
        """Return a borrowed book"""
        with self.get_db() as conn:
            cursor = conn.cursor()
            
            # Verify borrowing exists and belongs to user
            cursor.execute(
                "SELECT borrowing_id FROM Borrowings WHERE user_id = ? AND borrowing_id = ? AND return_date IS NULL",
                (user_id, borrowing_id)
            )
            borrowing = cursor.fetchone()
            
            if not borrowing:
                return False, "Book not found or not borrowed by you"
            
            # UpdateBookCopyOnReturn trigger will reset the copy status
            cursor.execute(
                "UPDATE Borrowings SET return_date = CURRENT_TIMESTAMP WHERE borrowing_id = ?",
                (borrowing['borrowing_id'],)
            )
            return True, "Book returned successfully"
    
    def toggle_favorite(self, user_id, book_id):
        """Toggle favorite status for a book"""
        with self.get_db() as conn:
            cursor = conn.cursor()
            
            # Check if already in favorites
            cursor.execute(
                "SELECT favorite_id FROM Favorites WHERE user_id = ? AND book_id = ?",
                (user_id, book_id)
            )
            favorite = cursor.fetchone()
            
            if favorite:
                cursor.execute("DELETE FROM Favorites WHERE favorite_id = ?", (favorite['favorite_id'],))
                return "removed"
            else:
                # Add to favorites - notifications will be handled by triggers
                cursor.execute(
                    "INSERT INTO Favorites (user_id, book_id) VALUES (?, ?)",
                    (user_id, book_id)
                )
                return "added"

    def upgrade_membership(self, user_id, membership_type_id):
        """Upgrade a user to a specific membership type"""
        with self.get_db() as conn:
            cursor = conn.cursor()
            
            # Verify membership type exists
            cursor.execute(
                "SELECT membership_type_id FROM MembershipTypes WHERE membership_type_id = ?", 
                (membership_type_id,)
            )
            membership = cursor.fetchone()
            if not membership:
                return False, "Invalid membership type"
            
            # Update user membership
            cursor.execute(
                """UPDATE Users 
                SET is_a_member = 1, 
                    membership_type_id = ?, 
                    membership_last_renewed = CURRENT_TIMESTAMP 
                WHERE user_id = ?""",
                (membership_type_id, user_id)
            )
            
            return True, "Membership upgraded successfully"
    
