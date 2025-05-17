# urls.py for your app (e.g., frontend/urls.py)
from django.urls import path, include
from django.contrib.auth.views import LogoutView
from . import views
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # Frontend Views
    path('', views.home, name='home'),
    path('add-edit', views.add_edit, name='add_edit'),
    path('admin-dashboard', views.admin_dashboard, name='admin_dashboard'),
    path('books', views.books, name='books'),
    path('book-details', views.book_details, name='book_details'),
    path('borrowed', views.borrowed, name='borrowed'),
    path('profile', views.profile, name='profile'),
    path('sign-in', views.sign_in, name='sign_in'),
    path('sign-up', views.sign_up, name='sign_up'),
    path('forgot-password', views.forgot_password, name='forgot_password'),
    path('user-dashboard', views.user_dashboard, name='user_dashboard'),
    path('logout/', views.logout_user, name='logout'),
<<<<<<< Updated upstream
    path('add-book', views.add_book, name='add_book'),
    path('delete-book', views.delete_book, name='delete_book'),
    path('get-book/<int:book_id>', views.get_book, name='get_book'),
    path('edit-book/<int:book_id>', views.edit_book, name='edit_book'),
    path('api/copies/add-copies', views.add_copies, name='add_copies'),
    path('api/copies/get-copies/<int:book_id>', views.get_copies, name='get_copies'),
    path('api/users/borrowers/<int:book_id>', views.get_borrowers, name='get_borrowers'),
    path('api/books/check-isbn/<int:isbn>', views.check_isbn, name='check_isbn'),
=======
>>>>>>> Stashed changes


    # API Endpoints
    path('profile/update_picture/', views.update_profile_picture, name='update_profile_picture'), # API for profile pic
    path('add-book', views.add_book, name='add_book'), # API to add book
    path('delete-book', views.delete_book, name='delete_book'), # API to delete book
    path('get-book/<int:book_id>', views.get_book, name='get_book'), # API to get single book
    path('edit-book/<int:book_id>', views.edit_book, name='edit_book'), # API to edit book
    path('add-copies', views.add_copies, name='add_copies'), # API to add book copies

    # Password Reset URLs (APIs)
    path('send-verification-email/', views.send_verification_email_view, name='send_verification_email'),
    path('verify-reset-code/', views.verify_reset_code_view, name='verify_reset_code'),
    path('reset-password-confirm/', views.reset_password_confirm_view, name='reset_password_confirm'),

    # Book and User Data APIs
    path('api/books/', views.get_books, name='api_books'), # API to get list of books
    path('api/books/<int:book_id>/', views.get_book_details, name='get_book_details'), # API to get book details
    path('api/user/current/', views.get_current_user, name='get_current_user'), # API to get current user info

    # Borrowing, Renewing, Returning APIs
    path('api/books/<int:book_id>/borrow/', views.borrow_book, name='borrow_book'), # API to borrow a book
    path('api/borrowings/current/', views.get_current_user_borrowings, name='get_current_user_borrowings'), # API to get current borrowings
    path('api/borrowings/history/', views.get_user_borrowing_history, name='get_user_borrowing_history'), # API to get borrowing history
    path('api/borrowings/<int:borrowing_id>/renew/', views.renew_book, name='renew_book'), # API to renew a book
    path('api/borrowings/<int:borrowing_id>/return/', views.return_book, name='return_book'), # API to return a book


    # Favorites APIs
    path('api/books/<int:book_id>/favorite/', views.add_remove_favorite, name='add_remove_favorite'), # API to toggle favorite status
    path('api/user/favorites/', views.get_user_favorites, name='get_user_favorites'), # API to get user favorites

    # Add other URLs here
]

# Add this to serve media files during development
# IMPORTANT: In production, you should serve media files using a proper web server (like Nginx)
# or a cloud storage service (like AWS S3). This is for development convenience only.
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)