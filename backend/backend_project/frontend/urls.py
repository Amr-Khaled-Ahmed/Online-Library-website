# backend_project/urls.py
from django.urls import path
from django.contrib.auth.views import LogoutView
from . import views
from django.conf import settings
from django.conf.urls.static import static


urlpatterns = [
    path('', views.home, name='home'),
    path('add-edit', views.add_edit, name='add_edit'),
    path('admin-dashboard', views.admin_dashboard, name='admin_dashboard'),
    path('books', views.books, name='books'),
    path('book-details', views.book_details, name='book_details'),
    path('borrowed', views.borrowed, name='borrowed'),
    path('profile', views.profile, name='profile'),
    path('profile', views.profile, name='profile'),
    # Add URL for updating profile picture
    path('profile/update_picture/', views.update_profile_picture, name='update_profile_picture'),
    # Removed the delete account URL pattern

    path('sign-in', views.sign_in, name='sign_in'),
    path('sign-up', views.sign_up, name='sign_up'),

    path('forgot-password', views.forgot_password, name='forgot_password'),
    path('user-dashboard', views.user_dashboard, name='user_dashboard'),
    path('logout/', views.logout_user, name='logout'),
    path('add-book', views.add_book, name='add_book'),
    path('delete-book', views.delete_book, name='delete_book'),
    path('get-book/<int:book_id>', views.get_book, name='get_book'),
    path('edit-book/<int:book_id>', views.edit_book, name='edit_book'),
    path('api/copies/add-copies', views.add_copies, name='add_copies'),
    path('api/copies/get-copies/<int:book_id>', views.get_copies, name='get_copies'),
    path('api/users/borrowers/<int:book_id>', views.get_borrowers, name='get_borrowers'),
    path('api/books/check-isbn/<int:isbn>', views.check_isbn, name='check_isbn'),

    #  Password Reset URL Patterns
    path('send-verification-email/', views.send_verification_email_view, name='send_verification_email'),
    path('verify-reset-code/', views.verify_reset_code_view, name='verify_reset_code'),
    path('reset-password-confirm/', views.reset_password_confirm_view, name='reset_password_confirm'),


    path('api/books/', views.get_books, name='api_books'),
    path('api/books/<int:book_id>/', views.get_book_details, name='get_book_details'),
    path('api/books/<int:book_id>/borrow/', views.borrow_book, name='borrow_book'),
    path('api/user/current/', views.get_current_user, name='get_current_user'),

    # path('about', views.about, name='about'),
]

# Add this to serve media files during development
# IMPORTANT: In production, you should serve media files using a proper web server (like Nginx)
# or a cloud storage service (like AWS S3). This is for development convenience only.
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)