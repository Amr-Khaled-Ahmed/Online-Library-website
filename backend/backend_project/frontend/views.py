# views.py
import random
import string
import traceback
from datetime import date # Import date for comparisons


from django.db.models import Q
# from django.db.models.fields import json
from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse, HttpResponseForbidden
from django.core.mail import send_mail
from django.contrib import messages
from django.conf import settings
import os
# Assuming LibraryAPI is used elsewhere and needed
# from .db_api import LibraryAPI # This import was commented out by the user
import logging
from django.http.response import HttpResponse
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login as auth_login, logout as auth_logout
# check_password is no longer needed if delete_account is removed
# from django.contrib.auth.hashers import check_password
from django.db import IntegrityError, transaction
from django.views.decorators.csrf import csrf_exempt

from .models import Customer, Admin, Membershiptypes, Borrowings, Favorites, Authors, Genres, \
    Books, Bookauthor, Bookgenre, Bookcopies, PasswordResetToken  # Import necessary models
from django.urls import reverse
from django.views.decorators.http import require_POST  # Import require_POST
from django.contrib.auth.decorators import login_required
from django.utils import timezone  # Import timezone
from datetime import timedelta
import json
# Import FileSystemStorage for saving files and OperationalError
from django.core.files.storage import FileSystemStorage
from django.db.utils import OperationalError
# customize email
from django.core.mail import send_mail, EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.contrib.auth.hashers import make_password
import traceback

from django.shortcuts import get_object_or_404
from django.db import transaction
logger = logging.getLogger(__name__)
# Initialize the library API (if needed globally)
db_path = os.path.join(settings.BASE_DIR, 'library.db')
# library_api = LibraryAPI(db_path) # Removed or commented out as LibraryAPI is not imported


GENRE_MAPPING = {
    'fiction': 'Fiction',
    'non-fiction': 'Non-Fiction',
    'mystery': 'Mystery',
    'fantasy': 'Fantasy',
    'sci-fi': 'Science Fiction',
    'romance': 'Romance',
    'biography': 'Biography',
    'history': 'History',
    'self-help': 'Self-Help',
}

GENRE_MAPPING_REV = {
    'Fiction': 'fiction',
    'Non-Fiction': 'non-fiction',
    'Mystery': 'mystery',
    'Fantasy': 'fantasy',
    'Science Fiction': 'sci-fi',
    'Romance': 'romance',
    'Biography': 'biography',
    'History': 'history',
    'Self-Help': 'self-help',
}


# Create your views here.
def home(request):
    return render(request, 'frontend/index.html')


def books(request):
    return render(request, 'frontend/pages/books.html')


def add_edit(request):
    return render(request, 'frontend/pages/add_edit.html')


def admin_dashboard(request):
    books = Books.objects.filter(is_deleted=0).prefetch_related(
        'bookauthor_set__author',
        'bookgenre_set__genre',
        'bookcopies_set'
    )

    print(books)

    query = request.GET.get('q')
    genre = GENRE_MAPPING.get(request.GET.get('genre'))
    sort = request.GET.get('sort')
    availability = request.GET.get('availability')

    if query:
        books = books.filter(
            Q(title__icontains=query) |
            Q(isbn__icontains=query) | # Changed to icontains for partial ISBN matches
            Q(bookauthor__author__name__icontains=query)
        ).distinct() # Use distinct to avoid duplicates if a book has multiple authors/genres

    if genre:
        books = books.filter(bookgenre__genre__name__iexact=genre).distinct()

    # Availability filtering - needs to be done after fetching related book_copies
    enriched_books = []

    for book in books:
        authors = [ba.author for ba in book.bookauthor_set.all()]
        genres = [bg.genre for bg in book.bookgenre_set.all()]
        # Only count copies that are in inventory and not borrowed
        available_copies_count = book.bookcopies_set.filter(is_borrowed=False, in_inventory=True).count()
        total_copies_count = book.bookcopies_set.count()


        borrowers = []
        # This part is for admin dashboard to see who borrowed copies
        for copy in book.bookcopies_set.all():
            try:
                # Look for active borrowings for this specific copy
                borrowing = Borrowings.objects.get(copy=copy, return_date__isnull=True)
                # Append the borrower's User object if they haven't been added yet
                if borrowing.user and borrowing.user.user not in borrowers: # Access the underlying User object
                    borrowers.append(borrowing.user.user) # Store the User object

            except Borrowings.DoesNotExist:
                # No active borrowing for this copy, skip
                continue
            except Exception as e:
                 # Log any unexpected errors finding borrowers
                 logger.error(f"Error finding borrower for copy {copy.copy_id}: {e}", exc_info=True)


        enriched_books.append({
            'book': book,
            'authors': authors,
            'genres': genres,
            'available_copies_count': available_copies_count,
            'total_copies_count': total_copies_count,
            'borrowers_count': len(borrowers),
            'borrowers': borrowers, # Include borrowers list for display if needed
        })
        print(book.ebook_availability)
        print(book.audiobook_availability)


    # Apply availability filter to the enriched list
    if availability == 'unavailable':
        enriched_books = [book for book in enriched_books if book['available_copies_count'] == 0]
    elif availability == 'low-stock':
        enriched_books = [book for book in enriched_books if book['available_copies_count'] <= 10 and book['available_copies_count'] > 0]
    elif availability == 'available':
        enriched_books = [book for book in enriched_books if book['available_copies_count'] > 10]
    # 'all' is the default and requires no filtering here


    # Apply sorting to the enriched list
    if sort == 'popular':
        # Sort by borrowers_count (most borrowed currently)
        enriched_books.sort(key=lambda x: x['borrowers_count'], reverse=True)
    # Note: Other sorts (title, author, year) were applied at the queryset level already


    return render(request, 'frontend/pages/admin_dashboard.html', {'books': enriched_books, 'genre_mapping': GENRE_MAPPING_REV})


@login_required  # Ensure user is logged in to view profile
def profile(request):
    user = request.user
    customer = None
    admin = None
    books_borrowed_count = 0
    books_favorited_count = 0
    profile_picture_url = None # Initialize profile picture URL

    # Get join year safely, defaulting if user.date_joined is None
    member_since_year = user.date_joined.year if user.date_joined else 'N/A'

    is_admin = hasattr(user, 'admin_profile') or user.is_superuser

    if is_admin:
        # Fetch admin profile and set profile picture URL
        if hasattr(user, 'admin_profile'):
            admin = user.admin_profile
            profile_picture_url = admin.profile_picture_url
    else:
        # Fetch customer profile and set profile picture URL
        if hasattr(user, 'customer_profile'):
            customer = user.customer_profile
            profile_picture_url = customer.profile_picture_url
            # Fetch counts from the database using the Customer object
            # Wrap in try/except to handle missing tables temporarily
            try:

                # Count currently borrowed books (return_date is null)
                books_borrowed_count = Borrowings.objects.filter(user=customer,
                                                                 return_date__isnull=True).count()
                # Count favorite books
                favorites_count = Favorites.objects.filter(user=customer).count()
                books_favorited_count = favorites_count # Assign to the correct variable name
            except OperationalError:
                # Log a warning or handle the error gracefully if tables are missing
                logger.warning(
                    "OperationalError: Borrowings or Favorites table not found. Counts set to 0. Please run migrations.")
                books_borrowed_count = 0
                books_favorited_count = 0
            except Exception as e:
                # Catch other potential database errors during query
                logger.error(f"An unexpected database error occurred in profile view: {e}", exc_info=True)
                books_borrowed_count = 0
                books_favorited_count = 0


    context = {
        'user': user,  # Django's built-in User object
        'customer': customer,  # Our custom Customer profile object
        'admin': admin, # Our custom Admin profile object
        'books_borrowed_count': books_borrowed_count,
        'books_favorited_count': books_favorited_count,
        'member_since_year': member_since_year,
        'is_admin': is_admin,  # Pass the admin status to the template
        'profile_picture_url': profile_picture_url, # Pass the correct profile picture URL
    }
    return render(request, 'frontend/pages/profile.html', context)


def book_details(request):
    return render(request, 'frontend/pages/book_details.html')


def borrowed(request):
    # The data for the borrowed page is now fetched via AJAX by borrowed.js
    # This view just needs to render the HTML structure
    return render(request, 'frontend/pages/borrowed.html')

def sign_up(request):
    context = {}

    if request.method == 'POST':
        username = request.POST.get('username', '').strip()
        first_name = request.POST.get('first_name', '').strip()
        last_name = request.POST.get('last_name', '').strip()
        email = request.POST.get('email', '').strip()
        password = request.POST.get('password', '')
        pass_confirm = request.POST.get('pass_confirm', '')

        # Determine user type - default to 'customer'
        user_type = request.POST.get('user_type', 'customer').strip().lower()

        context['form_data'] = request.POST  # For re-populating form on error

        if not all([username, first_name, last_name, email, password, pass_confirm]):
            messages.error(request, "All fields are required.")
            return render(request, "frontend/pages/sign-up.html", context)

        if password != pass_confirm:
            messages.error(request, "Passwords do not match.")
            return render(request, "frontend/pages/sign-up.html", context)

        if User.objects.filter(username=username).exists():
            messages.error(request, "This username is already taken. Please choose another one.")
            return render(request, "frontend/pages/sign-up.html", context)

        if User.objects.filter(email=email).exists():
            messages.error(request, "This email address is already registered. Please use a different email or log in.")
            return render(request, "frontend/pages/sign-up.html", context)

        if len(password) < 8:
            messages.error(request, "Password must be at least 8 characters long.")
            return render(request, "frontend/pages/sign-up.html", context)

        try:
            with transaction.atomic():  # Ensure atomicity
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    password=password,
                    first_name=first_name,
                    last_name=last_name
                )

                # Assuming 'admin' user_type is passed from a specific admin signup form or process
                # For a standard user-facing signup, you'd typically only create customers.
                # This check assumes the user_type comes from the form for demonstration.
                if user_type == 'admin':
                    # You might want to add a check here to ensure only authorized users can create admins
                    Admin.objects.create(
                        user=user
                    )
                    logger.info(f"Admin account created: username={username}, user_id={user.id}")
                    messages.success(request, "Admin account created successfully! You can now log in.")
                else:  # Default to customer
                    # Assign a default membership type if required and not null
                    # Assuming a Membershiptypes with ID 1 exists for default
                    default_membership_type = Membershiptypes.objects.filter(pk=1).first() # Or .get() and handle DoesNotExist

                    Customer.objects.create(
                        user=user,
                        role=0,  # Assuming 0 is customer role
                        membership_type=default_membership_type # Assign default membership type
                    )
                    logger.info(f"Customer account created: username={username}, user_id={user.id}")
                    messages.success(request, "Customer account created successfully! You can now log in.")

                return redirect('sign_in')

        except IntegrityError as e:
            logger.error(f"Integrity error during signup: {e}", exc_info=True)
            messages.error(request, "An error occurred during registration. It might be a duplicate entry.")
            # Attempt to clean up the User object if Customer/Admin creation failed
            if 'user' in locals() and hasattr(user, 'id'):  # Check if user object exists and has an id
                try:
                    User.objects.filter(id=user.id).delete()
                    logger.info(f"Cleaned up partially created user {user.username}")
                except Exception as cleanup_e:
                    logger.error(f"Failed to clean up user {user.username}: {cleanup_e}", exc_info=True)

            return render(request, "frontend/pages/sign-up.html", context)
        except Membershiptypes.DoesNotExist:
             logger.error("Default MembershipType with ID 1 not found during signup.", exc_info=True)
             messages.error(request, "An error occurred during registration: Default membership not found. Please contact support.")
             if 'user' in locals() and hasattr(user, 'id'):
                 try:
                     User.objects.filter(id=user.id).delete()
                     logger.info(f"Cleaned up partially created user {user.username}")
                 except Exception as cleanup_e:
                      logger.error(f"Failed to clean up user {user.username}: {cleanup_e}", exc_info=True)
             return render(request, "frontend/pages/sign-up.html", context)
        except Exception as e:
            logger.error(f"Unexpected error during signup: {e}", exc_info=True)
            messages.error(request, f"An unexpected error occurred: {e}")
            # Attempt to clean up the User object if an unexpected error occurred
            if 'user' in locals() and hasattr(user, 'id'):  # Check if user object exists and has an id
                try:
                    User.objects.filter(id=user.id).delete()
                    logger.info(f"Cleaned up partially created user {user.username}")
                except Exception as cleanup_e:
                    logger.error(f"Failed to clean up user {user.username}: {cleanup_e}", exc_info=True)
            return render(request, "frontend/pages/sign-up.html", context)

    # Add this return statement to handle GET requests
    return render(request, "frontend/pages/sign-up.html", context)


def sign_in(request):
    # Redirect authenticated users based on role
    if request.user.is_authenticated:
        logger.debug(f"User {request.user.username} is already authenticated.")
        if hasattr(request.user, 'admin_profile') or request.user.is_superuser:
            logger.debug(
                f"User {request.user.username} has admin_profile or is superuser. Redirecting to admin dashboard.")
            return redirect('admin_dashboard')
        elif hasattr(request.user, 'customer_profile'):
            logger.debug(f"User {request.user.username} has customer_profile. Redirecting to user dashboard.")
            return redirect('user_dashboard')
        else:
            # Should not happen if signup/admin creation is correct, but handle defensively
            logger.warning(f"Authenticated user {request.user.username} has no app role. Logging out.")
            # This line generates an error message if the user has no role
            messages.error(request, "Your user role is undefined. Please contact support.")
            auth_logout(request)
            return redirect('sign_in')

    context = {}
    if request.method == 'POST':
        username_or_email = request.POST.get('username', '').strip()
        password = request.POST.get('password', '')

        context['form_data'] = {'username': username_or_email}

        # This block generates an error message if fields are empty
        if not username_or_email or not password:
            messages.error(request, "Both username/email and password are required.")
            return render(request, "frontend/pages/sign-in.html", context)

        # Authenticate using username or email
        user = authenticate(request, username=username_or_email, password=password)

        # If authentication failed with username, try with email if the input looks like an email
        if user is None and '@' in username_or_email:
            try:
                user_by_email = User.objects.get(email=username_or_email)
                user = authenticate(request, username=user_by_email.username, password=password)
            except User.DoesNotExist:
                user = None  # Still no user found

        if user is not None:
            if user.is_active:
                auth_login(request, user)
                logger.info(f"Successful login for user: {username_or_email}")

                # Redirect authenticated user based on role
                if hasattr(request.user, 'admin_profile') or request.user.is_superuser:
                    logger.debug(
                        f"User {request.user.username} has admin_profile or is superuser (post-login). Redirecting to admin dashboard.")
                    return redirect('admin_dashboard')
                elif hasattr(request.user, 'customer_profile'):
                    logger.debug(
                        f"User {request.user.username} has customer_profile (post-login). Redirecting to user dashboard.")
                    return redirect('user_dashboard')
                else:
                    # Fallback for authenticated users without a defined app role
                    logger.warning(
                        f"Authenticated user {request.user.username} has no app role post-login. Logging out.")
                    # This line generates an error message if the user has no role after successful auth
                    messages.error(request,
                                   "Login successful, but no role (Admin/Customer) is assigned. Please contact support.")
                    auth_logout(request)
                    return redirect('sign_in')
            else:
                logger.warning(f"Attempted login for inactive user: {username_or_email}")
                # This line generates an error message for inactive accounts
                messages.error(request, "This account is inactive. Please contact support.")
                return render(request, "frontend/pages/sign-in.html", context)
        else:
            logger.warning(f"Failed login attempt for: {username_or_email}")
            # This line generates the error message for invalid credentials
            messages.error(request, "Invalid username/email or password. Please try again.")
            return render(request, "frontend/pages/sign-in.html", context)

    return render(request, "frontend/pages/sign-in.html", context)


def user_dashboard(request):
    if not request.user.is_authenticated:
        messages.error(request, 'You must be logged in to access the user dashboard')
        return redirect('sign_in')

    # Ensure the logged-in user has a customer profile
    # This check is redundant if access is restricted by login_required and URL pattern
    # but kept for clarity or if this view might be accessed differently
    if not hasattr(request.user, 'customer_profile'):
        messages.error(request, 'You do not have permission to access the user dashboard')
        return redirect('home') # Or redirect to profile with a message

    # You would typically fetch user-specific data for the dashboard here
    # e.g., recent borrowings, notifications, etc.
    # For now, just rendering the template
    return render(request, 'frontend/pages/user_dashboard.html')


def forgot_password(request):
    # This view is for password reset functionality (not implemented here)
    return render(request, 'frontend/pages/forgetPassword.html')


def logout_user(request):
    auth_logout(request)
    # Redirect to the home page or a logout success page
    messages.success(request, 'You have been successfully logged out.')
    return redirect(reverse('home'))


# Removed the delete_account view function


@login_required
@require_POST
def update_profile_picture(request):
    """Handles uploading or clearing the user's profile picture for both Admin and Customer."""
    user = request.user

    # Determine if the user is an admin or customer
    is_admin = hasattr(user, 'admin_profile') or user.is_superuser
    profile_obj = None

    if is_admin:
        if hasattr(user, 'admin_profile'):
            profile_obj = user.admin_profile
        else:
             # This case should ideally not happen if user is superuser but lacks admin_profile
             # Log a warning or handle appropriately
             logger.warning(f"Superuser {user.username} attempting profile update without admin_profile.")
             messages.error(request, 'Admin profile not found.')
             return JsonResponse({'success': False, 'message': 'Admin profile not found'}, status=400)

    elif hasattr(user, 'customer_profile'):
        profile_obj = user.customer_profile
    else:
        messages.error(request, 'User profile not found.')
        return JsonResponse({'success': False, 'message': 'User profile not found'}, status=400)


    if 'profile_picture' in request.FILES:
        # Handle uploading a new profile picture
        uploaded_file = request.FILES['profile_picture']
        fs = FileSystemStorage()

        # Optional: Delete the old file if it exists
        if profile_obj.profile_picture_url:
            try:
                # Extract the file name from the URL and join it with MEDIA_ROOT
                old_file_name = profile_obj.profile_picture_url.replace(settings.MEDIA_URL, '', 1)
                old_file_path = os.path.join(settings.MEDIA_ROOT, old_file_name)
                if os.path.exists(old_file_path):
                    os.remove(old_file_path)
                    logger.info(f"Deleted old profile picture: {old_file_path}")
            except Exception as e:
                logger.error(f"Error deleting old profile picture file for user {user.username}: {e}")

        # Save the new file
        # You might want a more robust naming strategy (e.g., using user ID)
        # Construct a subdirectory based on user type (admin or customer)
        subdirectory = 'profile_pictures/admins' if is_admin else 'profile_pictures/customers'
        filename = fs.save(os.path.join(subdirectory, uploaded_file.name), uploaded_file)


        # Get the URL to the saved file
        file_url = fs.url(filename)

        # Update the profile_picture_url in the respective model
        profile_obj.profile_picture_url = file_url
        try:
            profile_obj.save()
            messages.success(request, 'Profile picture updated successfully!')
            return JsonResponse({'success': True, 'profile_picture_url': file_url})  # Return JSON for AJAX
        except Exception as e:
            logger.error(f"Error saving profile picture URL for user {user.username}: {e}", exc_info=True)
            messages.error(request, 'Failed to save profile picture to database.')
            # Optional: Clean up the saved file if database save fails
            try:
                saved_file_path = os.path.join(settings.MEDIA_ROOT, filename)
                if os.path.exists(saved_file_path):
                    os.remove(saved_file_path)
                    logger.info(f"Cleaned up saved file after DB error: {saved_file_path}")
            except Exception as cleanup_e:
                 logger.error(f"Error cleaning up file after DB save failure: {cleanup_e}", exc_info=True)

            return JsonResponse({'success': False, 'message': 'Failed to save profile picture to database.'},
                                status=500)


    elif request.POST.get('clear_picture') == 'true':
        # Handle clearing the profile picture
        if profile_obj.profile_picture_url:
            # Optional: Delete the old file from storage
            try:
                # Get the path from the URL and delete the file
                file_name = profile_obj.profile_picture_url.replace(settings.MEDIA_URL, '', 1)
                file_path = os.path.join(settings.MEDIA_ROOT, file_name)
                if os.path.exists(file_path):
                    os.remove(file_path)
                    logger.info(f"Deleted profile picture: {file_path}")
            except Exception as e:
                logger.error(f"Error deleting old profile picture file for user {user.username}: {e}")

            profile_obj.profile_picture_url = None
            try:
                profile_obj.save()
                messages.success(request, 'Profile picture removed successfully!')
                return JsonResponse({'success': True, 'cleared': True})  # Return JSON for AJAX
            except Exception as e:
                logger.error(f"Error saving (clearing) profile picture URL for user {user.username}: {e}",
                             exc_info=True)
                messages.error(request, 'Failed to remove profile picture from database.')
                return JsonResponse({'success': False, 'message': 'Failed to remove profile picture from database.'},
                                    status=500)
        else:
            messages.info(request, 'No profile picture to remove.')
            return JsonResponse({'success': False, 'message': 'No picture to remove'}, status=400)

    messages.error(request, 'No image file provided or invalid request.')
    return JsonResponse({'success': False, 'message': 'No image file provided'}, status=400)


def check_isbn(request, isbn):
    try:
        book = Books.objects.filter(isbn=isbn)
        data = {
            'exist': book.exists()
        }
        return JsonResponse(data)
    except Exception as e:
        print(traceback.format_exc())
        return JsonResponse({'error': str(e)}, status=400)


def add_book(request):
    if request.method == 'POST':
        try:
            # Retrieve book data from body of the request
            data = json.loads(request.body)

            isbn = data.get('isbn')
            title = data.get('title').strip().title()
            author_name = data.get('author').strip().title()
            coverPath = data.get('coverPath')
            genre_name = data.get('genre')
            pubYear = data.get('pubYear')
            pageCount = data.get('pageCount')
            description = data.get('description').strip().capitalize()

            # Check for existing book with the same ISBN
            if Books.objects.filter(isbn=isbn, is_deleted=False).exists():
                 return JsonResponse({'error': 'A book with this ISBN already exists.'}, status=400)


            author, created = Authors.objects.get_or_create(
                name=author_name,
                defaults={'biography': '', 'photo_url': ''}
            )

            genre, created = Genres.objects.get_or_create(
                name=GENRE_MAPPING.get(genre_name),
                defaults={'description': ''}
            )

            # Insert book in database
            new_book = Books.objects.create(
                title=title,
                isbn=isbn,
                publication_year=pubYear,
                cover_image_url=coverPath,
                page_count=pageCount,
                language='en', # Default language
                description=description,
                # added_date is auto_now_add=True
            )

            Bookauthor.objects.create(
                book=new_book,
                author=author
            )

            Bookgenre.objects.create(
                book=new_book,
                genre=genre
            )

            return JsonResponse({'message': 'Book added successfully', 'book_id': new_book.book_id}) # Return book_id
        except Exception as e:
            logger.error(f"Error adding book: {e}", exc_info=True)
            return JsonResponse({'error': str(e)}, status=400)
    else:
        return JsonResponse({'error': 'Invalid request method'}, status=405)



@csrf_exempt
def delete_book(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            book_id = data.get('book_id')

            # Use get_object_or_404 for cleaner handling of not found
            book = get_object_or_404(Books, book_id=book_id, is_deleted=False)

            # Soft delete the book
            book.is_deleted = True # Use True for BooleanField
            book.deleted_at = timezone.now()
            book.save()

            # Consider adding logic to handle active borrowings for this book
            # e.g., notify users, mark borrowings as cancelled, etc.
            # For now, the book is just marked as deleted, and related objects remain.

            return JsonResponse({'message': 'Book deleted successfully'})
        except Books.DoesNotExist:
            return JsonResponse({'error': 'Book not found or already deleted'}, status=404)
        except Exception as e:
            logger.error(f"Error deleting book {book_id}: {e}", exc_info=True)
            return JsonResponse({'error': str(e)}, status=400)
    else:
        return JsonResponse({'error': 'Invalid request method'}, status=405)


def get_book(request, book_id):
    try:
        # Use get_object_or_404 for cleaner handling of not found
        book = get_object_or_404(Books, book_id=book_id, is_deleted=False)
        # Use .first() safely as it returns None if no object is found
        book_author = Bookauthor.objects.filter(book=book, author__isnull=False).first()
        book_genre = Bookgenre.objects.filter(book=book).first()

        # Ensure author and genre exist before accessing their names
        author_name = book_author.author.name if book_author and book_author.author else 'Unknown Author'
        genre_name = book_genre.genre.name if book_genre and book_genre.genre else 'Unknown Genre'

        data = {
            'isbn': book.isbn,
            'title': book.title,
            'author': author_name,
            'coverPath': book.cover_image_url,
            'genre': GENRE_MAPPING_REV.get(genre_name),  # Use mapped genre name
            'pubYear': book.publication_year,
            'pageCount': book.page_count,
            'description': book.description,
             # Include copy information for editing purposes if needed
            'hardcover_copies': book.bookcopies_set.filter(format='Hardcover', in_inventory=True, is_borrowed=False).count(),
            'paperback_copies': book.bookcopies_set.filter(format='Paperback', in_inventory=True, is_borrowed=False).count(),
            'ebook_available': book.ebook_availability > 0,
            'audiobook_available': book.audiobook_availability > 0,

        }
        return JsonResponse(data)
    except Books.DoesNotExist:
        return JsonResponse({'error': 'Book not found'}, status=404)
    except Exception as e:
        # Catch other potential errors during data retrieval
        logger.error(f"Error getting book details for {book_id}: {e}", exc_info=True)
        return JsonResponse({'error': str(e)}, status=400)


@csrf_exempt
def edit_book(request, book_id):
    if request.method == 'POST':
        try:
            # Use get_object_or_404 for cleaner handling of not found
            book = get_object_or_404(Books, book_id=book_id, is_deleted=False)

            new_book_data = json.loads(request.body)

            book.isbn = new_book_data.get('isbn')
            book.title = new_book_data.get('title').strip().title()

            author_name = new_book_data.get('author').strip().title()
            genre_name_mapped = GENRE_MAPPING.get(new_book_data.get('genre')) # Get mapped name

            # Update or create Author
            author_obj, created = Authors.objects.get_or_create(name=author_name)
            book_author_obj = Bookauthor.objects.filter(book=book).first()
            if book_author_obj:
                book_author_obj.author = author_obj
                book_author_obj.save()
            else:
                Bookauthor.objects.create(book=book, author=author_obj)

            book.cover_image_url = new_book_data.get('coverPath')

            # Update or create Genre
            genre_obj, created = Genres.objects.get_or_create(name=genre_name_mapped) # Use mapped name
            book_genre_obj = Bookgenre.objects.filter(book=book).first()
            if book_genre_obj:
                book_genre_obj.genre = genre_obj
                book_genre_obj.save()
            else:
                Bookgenre.objects.create(book=book, genre=genre_obj)


            book.publication_year = new_book_data.get('pubYear')
            book.page_count = new_book_data.get('pageCount')
            book.description = new_book_data.get('description').strip().capitalize()

            # Update ebook/audiobook availability (assuming the frontend sends booleans)
            book.ebook_availability = 1 if new_book_data.get('ebook', False) else 0
            book.audiobook_availability = 1 if new_book_data.get('audiobook', False) else 0

            book.save()
            return JsonResponse({'message': 'Book updated successfully'})
        except Books.DoesNotExist:
            return JsonResponse({'error': 'Book not found or already deleted'}, status=404)
        except Exception as e:
            logger.error(f"Error editing book {book_id}: {e}", exc_info=True)
            return JsonResponse({'error': str(e)}, status=400)
    else:
        return JsonResponse({'error': 'Invalid request method'}, status=405)


@csrf_exempt  # Keep this if you intend to use it for this view
def add_copies(request):
    if request.method == 'POST':
        try:
            # Retrieve book copies data from body of the request
            data = json.loads(request.body)

            bookId = data.get('bookId')

            hardcover = int(data.get('hardcover', 0)) # Default to 0 if not provided
            paperback = int(data.get('paperback', 0)) # Default to 0 if not provided
            ebook = data.get('ebook', False)
            audiobook = data.get('audiobook', False)

            # Use get_object_or_404 for cleaner handling of not found
            book = get_object_or_404(Books, book_id=bookId, is_deleted=False)

            # Add new physical copies
            with transaction.atomic(): # Use transaction for adding multiple copies
                for i in range(hardcover):
                    Bookcopies.objects.create(
                        book=book,
                        format='Hardcover',
                        # is_borrowed and in_inventory default to False/True respectively
                    )

                for i in range(paperback):
                    Bookcopies.objects.create(
                        book=book,
                        format='Paperback',
                        # is_borrowed and in_inventory default to False/True respectively
                    )


            # Update ebook/audiobook availability directly on the Book model
            book.ebook_availability = 1 if ebook else 0
            book.audiobook_availability = 1 if audiobook else 0
            book.save()

            # You might want to return updated copy counts in the response
            updated_hardcover_count = Bookcopies.objects.filter(book=book, format='Hardcover').count()
            updated_paperback_count = Bookcopies.objects.filter(book=book, format='Paperback').count()


            return JsonResponse({
                'message': 'Copies and availability updated successfully',
                'hardcover_count': updated_hardcover_count,
                'paperback_count': updated_paperback_count,
                'ebook_available': book.ebook_availability > 0,
                'audiobook_available': book.audiobook_availability > 0,
            })
        except Books.DoesNotExist:
            return JsonResponse({'error': 'Book not found'}, status=404)
        except Exception as e:
            logger.error(f"Error adding copies for book {bookId}: {e}", exc_info=True)
            return JsonResponse({'error': str(e)}, status=400)
    else:
        return JsonResponse({'error': 'Invalid request method'}, status=405)


def get_copies(request,book_id):
    try:
        book = Books.objects.get(book_id=book_id)

        copies = {
            'hardcover': Bookcopies.objects.filter(book=book, format='Hardcover').count(),
            'paperback': Bookcopies.objects.filter(book=book, format='Paperback').count(),
            'ebook': book.ebook_availability,
            'audiobook': book.audiobook_availability
        }

        return JsonResponse(copies)
    except Books.DoesNotExist:
        return JsonResponse({'error': 'Book not found'}, status=404)
    except Exception as e:
        print(traceback.format_exc())
        return JsonResponse({'error': str(e)}, status=400)


def get_borrowers(request,book_id):
    try:
        book = Books.objects.get(book_id=book_id)

        borrowings = Borrowings.objects.filter(copy__book=book)

        borrows = []

        for borrow in borrowings:
            borrows.append({
                'username': borrow.user.user.first_name,
                'profilePic': borrow.user.profile_picture_url,
                'format': borrow.format,
                'borrow_date': borrow.borrow_date.strftime("%Y-%m-%dT%H:%M"),
                'return_date': borrow.return_date.strftime("%Y-%m-%dT%H:%M") if borrow.return_date
                else (borrow.borrow_date + timedelta(days=30)).strftime("%Y-%m-%dT%H:%M")
            })

        return JsonResponse({'borrowers': borrows})
    except Books.DoesNotExist:
        return JsonResponse({'error': 'Book not found'}, status=404)
    except Exception as e:
        print(traceback.format_exc())
        return JsonResponse({'error': str(e)}, status=400)


@csrf_exempt
def get_book_details(request, book_id):
    try:
        # Use get_object_or_404 for cleaner handling of not found
        book = get_object_or_404(Books, book_id=book_id, is_deleted=False)
        book_author = Bookauthor.objects.filter(book=book, author__isnull=False).first()
        book_genre = Bookgenre.objects.filter(book=book).first()
        book_copies = Bookcopies.objects.filter(book=book)

        # Check availability for physical copies
        available_physical_copies = book_copies.filter(is_borrowed=False, in_inventory=True).count()

        # Determine overall availability
        is_available = available_physical_copies > 0 or book.ebook_availability > 0 or book.audiobook_availability > 0


        data = {
            'id': book.book_id,
            'title': book.title,
            'author': book_author.author.name if book_author else "Unknown",
            'cover_path': book.cover_image_url,
            'genre': GENRE_MAPPING_REV.get(book_genre.genre.name) if book_genre and book_genre.genre else "Unknown",
            'publication_year': book.publication_year,
            'description': book.description,
            'is_available': is_available, # Overall availability (physical or digital)
            'available_physical_copies': available_physical_copies, # Specific count for physical
            'ebook_available': book.ebook_availability > 0,
            'audiobook_available': book.audiobook_availability > 0,
            'isbn': book.isbn, # Include ISBN for details page
            'page_count': book.page_count, # Include page count
            'language': book.language, # Include language
        }
        return JsonResponse(data)
    except Books.DoesNotExist:
        return JsonResponse({'error': 'Book not found'}, status=404)
    except Exception as e:
        logger.error(f"Error fetching book details for {book_id}: {e}", exc_info=True)
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def get_current_user(request):
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Not authenticated'}, status=401)

    try:
        user = User.objects.get(username=request.user.username)
        # You might want to include the user's role or profile ID here too
        is_admin = hasattr(user, 'admin_profile') or user.is_superuser

        user_data = {
            'id': user.id,
            'username': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'is_admin': is_admin,
             # You could add profile picture URL here if needed for frontend
        }

        # If customer profile exists, add relevant customer info
        if hasattr(user, 'customer_profile'):
             customer = user.customer_profile
             user_data['customer_id'] = customer.pk # Use primary key of Customer
             user_data['is_a_member'] = customer.is_a_member
             if customer.membership_type:
                  user_data['membership_type_name'] = customer.membership_type.name
                  user_data['max_renewal_count'] = customer.membership_type.max_renewal_count
                  user_data['borrow_duration_in_days'] = customer.membership_type.borrow_duration_in_days
                  user_data['renewal_duration_in_days'] = customer.membership_type.renewal_duration_in_days

        return JsonResponse(user_data)
    except User.DoesNotExist:
        # This should ideally not happen for an authenticated user
        logger.error(f"Authenticated user {request.user.username} not found in DB.", exc_info=True)
        return JsonResponse({'error': 'User profile data incomplete'}, status=404)
    except Exception as e:
        logger.error(f"Error fetching current user data: {e}", exc_info=True)
        return JsonResponse({'error': str(e)}, status=500)




@csrf_exempt
def get_books(request):
    try:
        # Start with all non-deleted books
        books = Books.objects.filter(is_deleted=False).prefetch_related(
            'bookauthor_set__author',
            'bookgenre_set__genre',
            'bookcopies_set' # Prefetch book copies
        )

        query = request.GET.get('q')
        genre_param = request.GET.get('genre') # Get the parameter value (e.g., 'fiction')
        sort = request.GET.get('sort')
        availability = request.GET.get('availability')
        format_filter = request.GET.get('format') # Get format filter


        if query:
            books = books.filter(
                Q(title__icontains=query) |
                Q(isbn__icontains=query) |
                Q(bookauthor__author__name__icontains=query)
            ).distinct()

        if genre_param:
            # Map the URL parameter back to the database name if necessary
            genre_name = GENRE_MAPPING.get(genre_param.lower(), genre_param) # Default to parameter if not in map
            books = books.filter(bookgenre__genre__name__iexact=genre_name).distinct()

        # Apply format filtering - this requires checking the related Bookcopies
        if format_filter:
             if format_filter.lower() == 'ebook':
                  books = books.filter(ebook_availability__gt=0).distinct()
             elif format_filter.lower() == 'audiobook':
                  books = books.filter(audiobook_availability__gt=0).distinct()
             elif format_filter.lower() in ['hardcover', 'paperback']:
                  # Filter books that have at least one copy of the specified physical format
                  books = books.filter(bookcopies__format__iexact=format_filter).distinct()


        # Sorting - Popularity requires annotation/aggregation or sorting a pre-calculated list
        if sort == 'newest':
            books = books.order_by('-publication_year', '-added_date') # Sort by year then added date
        elif sort == 'oldest':
            books = books.order_by('publication_year', 'added_date')
        elif sort == 'title-asc':
            books = books.order_by('title')
        elif sort == 'title-desc':
            books = books.order_by('-title')
        # Sorting by author name requires care due to ManyToMany through BookAuthor
        # This might need annotation or sorting the final list
        # For now, relying on the distinct filter to avoid major issues, but true author sorting is complex here.
        elif sort == 'author-asc':
             books = books.order_by('bookauthor__author__name').distinct()
        elif sort == 'author-desc':
             books = books.order_by('-bookauthor__author__name').distinct()


        # Prepare data and apply availability/popularity filtering after fetching related data
        books_data = []
        for book in books:
            book_author = book.bookauthor_set.filter(author__isnull=False).first()
            book_genre = book.bookgenre_set.first()

            # Calculate available physical copies
            available_physical_copies = book.bookcopies_set.filter(is_borrowed=False, in_inventory=True).count()

            # Determine overall availability (physical or digital)
            is_available = available_physical_copies > 0 or book.ebook_availability > 0 or book.audiobook_availability > 0

            # Calculate popularity (count of active borrowings for this book)
            popularity_count = Borrowings.objects.filter(copy__book=book, return_date__isnull=True).count()


            # Apply availability filter here
            if availability == 'unavailable' and is_available:
                 continue # Skip if filtering for unavailable and book is available
            if availability == 'available' and not is_available:
                 continue # Skip if filtering for available and book is not available
            # Note: 'low-stock' filtering would require checking available_physical_copies here

            books_data.append({
                'book_id': book.book_id,
                'title': book.title,
                'author_name': book_author.author.name if book_author else "Unknown",
                'cover_image_url': book.cover_image_url,
                'genre_name': book_genre.genre.name if book_genre and book_genre.genre else "Unknown",
                'publication_year': book.publication_year,
                'description': book.description,
                'is_available': is_available, # Overall availability
                'available_physical_copies': available_physical_copies,
                'ebook_available': book.ebook_availability > 0,
                'audiobook_available': book.audiobook_availability > 0,
                'popularity': popularity_count, # Include popularity
            })

        # Apply 'low-stock' availability filter and 'popular' sort to the list after data preparation
        if availability == 'low-stock':
             # Filter after calculating available physical copies
             books_data = [book for book in books_data if book['available_physical_copies'] <= 10 and book['available_physical_copies'] > 0]

        if sort == 'popular':
             # Sort the prepared list by popularity
             books_data.sort(key=lambda x: x['popularity'], reverse=True)


        return JsonResponse(books_data, safe=False)
    except Exception as e:
        logger.error(f"Error fetching books: {e}", exc_info=True)
        return JsonResponse({'error': str(e)}, status=500)






# --- Password Reset Views ---

@csrf_exempt
def send_verification_email_view(request):
    """
    Handles the AJAX request to send a password reset verification email.
    Expects a POST request with JSON data containing the 'username_or_email'.
    Generates and saves a verification token and sends an HTML email.
    """
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            username_or_email = data.get('username_or_email')

            if not username_or_email:
                return JsonResponse({'success': False, 'error': 'Username or Email is required.'}, status=400)

            try:
                # Try to find user by username or email
                user = User.objects.filter(
                    Q(username=username_or_email) | Q(email__iexact=username_or_email)
                ).first()

                if user is None:
                     # Generic message for security, don't reveal if user exists
                     return JsonResponse({'success': False, 'error': 'If a user with that username or email exists, a verification email has been sent.'}, status=200)


                # --- Generate and Save Verification Token ---
                # Delete any existing unused tokens for this user
                PasswordResetToken.objects.filter(user=user, is_used=False, expires_at__gt=timezone.now()).delete()

                # Generate a unique 6-digit token
                while True:
                    verification_code = ''.join(random.choices(string.digits, k=6))
                    if not PasswordResetToken.objects.filter(token=verification_code).exists():
                        break # Found a unique token

                # Create and save the token
                # The expires_at is set automatically by the model's save method
                token_obj = PasswordResetToken.objects.create(user=user, token=verification_code)

                # --- Email Sending Logic (Using HTML Template) ---
                subject = 'Online Library - Password Reset Verification Code' # Improved subject
                from_email = settings.EMAIL_HOST_USER
                recipient_list = [user.email] # Send to the user's registered email address

                # Render the HTML email template
                # Ensure your template is in frontend/templates/emails/password_reset_code.html
                html_message = render_to_string('frontend/emails/password_reset_code.html', {

                    'username': user.username,
                    'verification_code': verification_code,
                    'sign_in_url': request.build_absolute_uri(reverse('sign_in')), # Pass the sign-in URL
                })

                # Create a plain text version as a fallback (recommended)
                plain_message = strip_tags(html_message)

                # Use EmailMultiAlternatives to send both versions
                email = EmailMultiAlternatives(subject, plain_message, from_email, recipient_list)
                email.attach_alternative(html_message, "text/html")

                email.send() # Send the email

                # Set session variable after successful email sending and token creation
                # Store the username for the next step
                request.session['password_reset_username'] = user.username


                return JsonResponse({'success': True, 'message': 'Verification code sent to your email.'})

            except Exception as e:
                # Log the error and print the full traceback
                logger.error(f"Error sending verification email: {e}", exc_info=True)
                # traceback.print_exc() # <--- This will print the detailed error!
                return JsonResponse({'success': False, 'error': 'An error occurred while trying to send the verification email. Please try again.'}, status=500)

        except json.JSONDecodeError:
            return JsonResponse({'success': False, 'error': 'Invalid data format. Please send valid JSON.'}, status=400)
    else:
        return JsonResponse({'success': False, 'error': 'Invalid request method. Only POST is allowed.'}, status=405)


@csrf_exempt
def verify_reset_code_view(request):
    """
    Handles the AJAX request to verify the password reset code.
    Expects a POST request with JSON data containing 'code'.
    Requires the username to be stored in the session from the previous step.
    """
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            code = data.get('code')
            username = request.session.get('password_reset_username') # Get username from session

            # Log details for debugging
            logger.debug(f"Verification code attempt for username: {username} with code: {code}")

            if not code or not username:
                # Clear session data if prerequisites are not met unexpectedly
                request.session.pop('password_reset_username', None)
                request.session.pop('password_reset_code_verified', None)
                return JsonResponse({'success': False, 'error': 'Password reset flow not initiated or session expired. Please start again.'}, status=400)

            try:
                user = User.objects.get(username=username)

                # Find a valid, unused token for this user with the matching code
                token_obj = PasswordResetToken.objects.filter(user=user, token=code, is_used=False, expires_at__gt=timezone.now()).first()

                if token_obj:
                    # Mark the token as used
                    token_obj.is_used = True
                    token_obj.save()

                    # Set a session variable to indicate code verification was successful
                    request.session['password_reset_code_verified'] = True
                    # You might store a token ID or user ID here for extra security in a production system

                    logger.info(f"Verification code successful for user: {username}")
                    return JsonResponse({'success': True, 'message': 'Code verified successfully.'})
                else:
                    logger.warning(f"Invalid or expired verification code attempt for user {username} with code {code}")
                    return JsonResponse({'success': False, 'error': 'Invalid or expired verification code.'}, status=400)

            except User.DoesNotExist:
                 # Should not happen if username is from session, but handle defensively
                logger.error(f"User not found during code verification for username from session: {username}", exc_info=True)
                request.session.pop('password_reset_username', None) # Clear session data
                request.session.pop('password_reset_code_verified', None)
                return JsonResponse({'success': False, 'error': 'User not found during code verification.'}, status=404)
            except Exception as e:
                logger.error(f"Error verifying reset code: {e}", exc_info=True)
                # Log the traceback for better debugging
                # traceback.print_exc() # <--- This will print the detailed error!
                # Clear session data on error to force restart of reset flow
                request.session.pop('password_reset_username', None)
                request.session.pop('password_reset_code_verified', None)
                return JsonResponse({'success': False, 'error': 'An error occurred during code verification. Please try again.'}, status=500)

        except json.JSONDecodeError:
            return JsonResponse({'success': False, 'error': 'Invalid data format. Please send valid JSON.'}, status=400)
    else:
        return JsonResponse({'success': False, 'error': 'Invalid request method. Only POST is allowed.'}, status=405)


@csrf_exempt
def reset_password_confirm_view(request):
    """
    Handles the AJAX request to set the new password after code verification.
    Expects a POST request with JSON data containing 'new_password'.
    Requires code verification to be confirmed via session.
    """
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            new_password = data.get('new_password')
            username = request.session.get('password_reset_username') # Get username from session
            code_verified = request.session.get('password_reset_code_verified') # Check session for verification status

            # Log details for debugging
            logger.debug(f"Reset password attempt for username: {username}")
            logger.debug(f"Code verified status in session: {code_verified}")


            if not new_password or not username or not code_verified:
                 # Return appropriate error if prerequisites are not met
                 error_message = 'New password is required.'
                 if not username:
                      error_message = 'Password reset flow not initiated or session expired. Please start again.'
                 elif not code_verified:
                     error_message = 'Code verification is required before setting a new password. Please go back and verify the code.'

                 # Clear session data if prerequisites are not met unexpectedly
                 request.session.pop('password_reset_username', None)
                 request.session.pop('password_reset_code_verified', None)


                 return JsonResponse({'success': False, 'error': error_message}, status=400)

            # Optional: Add password complexity validation here
            if len(new_password) < 8:
                 return JsonResponse({'success': False, 'error': 'New password must be at least 8 characters long.'}, status=400)


            try:
                user = User.objects.get(username=username)

                # Use Django's set_password method to handle hashing securely
                user.set_password(new_password)
                user.save()

                # Clear the password reset session data after successful reset
                request.session.pop('password_reset_username', None)
                request.session.pop('password_reset_code_verified', None)

                logger.info(f"Password reset successful for user: {username}")
                return JsonResponse({'success': True, 'message': 'Password has been reset successfully. You can now log in with your new password.'})

            except User.DoesNotExist:
                 # This case should ideally not happen if username is from a verified session,
                 # but handle defensively.
                logger.error(f"User not found during password reset confirmation for username from session: {username}", exc_info=True)
                request.session.pop('password_reset_username', None) # Clear session data
                request.session.pop('password_reset_code_verified', None)
                return JsonResponse({'success': False, 'error': 'User not found during password reset.'}, status=404)
            except Exception as e:
                logger.error(f"Error resetting password: {e}", exc_info=True)
                # Log the traceback for better debugging
                # traceback.print_exc() # <--- This will print the detailed error!
                # Clear session data on error to force restart of reset flow
                request.session.pop('password_reset_username', None)
                request.session.pop('password_reset_code_verified', None)
                return JsonResponse({'success': False, 'error': 'An error occurred while resetting your password. Please try again.'}, status=500)

        except json.JSONDecodeError:
            return JsonResponse({'success': False, 'error': 'Invalid data format. Please send valid JSON.'}, status=400)
    else:
        return JsonResponse({'success': False, 'error': 'Invalid request method. Only POST is allowed.'}, status=405)



# Replace the existing borrow_book function with this version in your views.py

@csrf_exempt
@login_required # Ensure the user is logged in to borrow
@require_POST # Ensure this view only accepts POST requests
def borrow_book(request, book_id):
    if request.method != 'POST':
        logger.warning(f"Borrow attempt with incorrect method: {request.method}.")
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    user = request.user
    if not hasattr(user, 'customer_profile'):
        logger.warning(f"Borrow attempt by user {user.username} without customer profile.")
        return JsonResponse({'error': 'User profile not found. Please ensure your account has a customer profile.'}, status=400)

    customer = user.customer_profile
    logger.info(f"Borrow attempt for book_id {book_id} by user {user.username} (Customer ID: {customer.pk}).") # Log borrow attempt

    try:
        # Use get_object_or_404 to handle book not found
        book = get_object_or_404(Books, book_id=book_id, is_deleted=False)
        logger.debug(f"Book \"{book.title}\" (ID: {book_id}) found.")

        # Check if the user has already borrowed an *unreturned* copy of this book
        # This query should NOT find a result if the book has been successfully returned.
        existing_user_unreturned_borrow = Borrowings.objects.filter(
            user=customer,
            copy__book=book,
            return_date__isnull=True
        ).first()

        if existing_user_unreturned_borrow:
            logger.warning(f"Borrow failed: User {user.username} already has an unreturned borrowing (ID: {existing_user_unreturned_borrow.borrowing_id}) for book \"{book.title}\".")
            return JsonResponse({'error': 'You have already borrowed a copy of this book that has not yet been returned.'}, status=400)
        logger.debug(f"User {user.username} does not have an active (unreturned) borrowing for book \"{book.title}\". Proceeding to check for available copies.")


        # Find an available physical copy that is not currently borrowed and is in inventory
        available_copy = Bookcopies.objects.filter(
            book=book,
            is_borrowed=False, # Filter for copies marked as not borrowed
            in_inventory=True  # Filter for copies marked as in inventory
        ).first() # Get the first available copy


        # Handle cases where no physical copy is available for borrowing
        if not available_copy:
             # Log the reason for no available physical copy
             total_copies = Bookcopies.objects.filter(book=book).count()
             borrowed_copies = Bookcopies.objects.filter(book=book, is_borrowed=True).count()
             not_in_inventory_copies = Bookcopies.objects.filter(book=book, in_inventory=False).count()
             logger.warning(f"Borrow failed: No available physical copies for book \"{book.title}\" (ID: {book_id}). "
                            f"Total copies: {total_copies}, Borrowed: {borrowed_copies}, Not in inventory: {not_in_inventory_copies}. "
                            f"Available physical copies count found: {Bookcopies.objects.filter(book=book, is_borrowed=False, in_inventory=True).count()}.")

             # Check for digital format availability if no physical copies
             if book.ebook_availability > 0:
                  logger.info(f"Ebook available for book \"{book.title}\". Digital borrowing not fully implemented.")
                  # --- Handle Ebook Borrowing Logic Here ---
                  return JsonResponse({'error': 'No physical copies available. Ebook is available - digital borrowing coming soon!'}, status=400)
             # Check for audiobook availability
             elif book.audiobook_availability > 0:
                  logger.info(f"Audiobook available for book \"{book.title}\". Digital borrowing not fully implemented.")
                  # --- Handle Audiobook Borrowing Logic Here ---
                  return JsonResponse({'error': 'No physical copies available. Audiobook is available - digital borrowing coming soon!'}, status=400)
             else:
                  # No copies (physical or digital via this method) available
                  logger.warning(f"Borrow failed: No physical or digital copies marked as available for book \"{book.title}\" (ID: {book_id}).")
                  return JsonResponse({'error': 'No available copies for borrowing'}, status=400)


        # If an available physical copy is found:
        logger.debug(f"Available copy (ID: {available_copy.copy_id}, Format: {available_copy.format}) found for book \"{book.title}\".")

        # Optional but recommended check: Verify that this 'available' copy is NOT already linked to an unreturned Borrowing
        # This checks for data inconsistency before the DB unique constraint on Borrowings.copy hits.
        unexpected_active_borrowing_for_copy = Borrowings.objects.filter(
            copy=available_copy,
            return_date__isnull=True
        ).first()

        if unexpected_active_borrowing_for_copy:
            # This indicates a critical data inconsistency - a copy is marked as not borrowed but has an active borrowing record.
            logger.critical(f"Data inconsistency: Found an 'available' copy (ID: {available_copy.copy_id}) that is linked to an active borrowing (ID: {unexpected_active_borrowing_for_copy.borrowing_id}) for user {unexpected_active_borrowing_for_copy.user.user.username}. Fixing BookCopies status for this copy.")
            # Attempt to fix the BookCopies status automatically
            available_copy.is_borrowed = True
            available_copy.borrower = unexpected_active_borrowing_for_copy.user # Link to the actual borrower profile
            available_copy.save()
            # Return an error indicating the book is not actually available due to inconsistency
            return JsonResponse({'error': 'Data inconsistency detected: The selected copy is currently borrowed. Please try again later or contact support.'}, status=500) # Use 500 for server issue


        # Proceed with creating the borrowing record and updating the copy within a transaction
        with transaction.atomic(): # Ensure atomicity for updating copy and creating borrowing
            # Create borrowing record
            borrow_date = timezone.now()

            # Calculate initial due date based on membership type borrow duration
            # Default duration if no membership type or duration is None
            borrow_duration_days = 14 # Default to 14 days if no membership config
            if customer.membership_type and customer.membership_type.borrow_duration_in_days is not None:
                borrow_duration_days = customer.membership_type.borrow_duration_in_days

            calculated_due_date = borrow_date + timezone.timedelta(days=borrow_duration_days)

            # Create the new Borrowings record
            new_borrowing = Borrowings.objects.create( # Capture the created object
                user=customer, # Link to the Customer object
                copy=available_copy, # Link to the specific Bookcopy
                format=available_copy.format, # Store the format of the borrowed copy
                borrow_date=borrow_date,
                due_date=calculated_due_date, # Set the initial due_date
                current_renew_count=0 # Start with 0 renewals
            )

            # Update the status of the specific book copy that was borrowed
            available_copy.is_borrowed = True
            available_copy.borrower = customer # Link the copy to the customer profile
            available_copy.save()
            logger.debug(f"Borrowing record (ID: {new_borrowing.borrowing_id}) created and copy status updated for copy ID: {available_copy.copy_id}.")


        # Log successful borrowing
        logger.info(f"Book \"{book.title}\" (ID: {book_id}, Copy ID: {available_copy.copy_id}) borrowed successfully by user {request.user.username} (Borrowing ID: {new_borrowing.borrowing_id}).")


        # Return success response including the due date
        # The due date might be needed by the frontend to display to the user
        return JsonResponse({'message': 'Book borrowed successfully', 'due_date': calculated_due_date.strftime('%Y-%m-%d')}) # Return date in YYYY-MM-DD format

    except Books.DoesNotExist:
        logger.warning(f"Borrow failed: Book with ID {book_id} not found.")
        return JsonResponse({'error': 'Book not found'}, status=404)
    except Exception as e:
        # Log the specific error for debugging
        logger.error(f"Unexpected error borrowing book {book_id} for user {request.user.username}: {e}", exc_info=True)
        # Return a generic error message to the user to avoid exposing internal details
        return JsonResponse({'error': 'An internal server error occurred while trying to borrow the book. Please try again later.'}, status=500)

@csrf_exempt
@login_required
def add_remove_favorite(request, book_id):
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    user = request.user
    if not hasattr(user, 'customer_profile'):
        return JsonResponse({'error': 'User profile not found.'}, status=400)

    customer = user.customer_profile

    try:
        book = get_object_or_404(Books, book_id=book_id, is_deleted=False)
        favorite, created = Favorites.objects.get_or_create(user=customer, book=book)

        if created:
            # Favorite was added
            return JsonResponse({'message': 'Book added to favorites', 'favorited': True, 'favorite_id': favorite.favorite_id})
        else:
            # Favorite already existed, so remove it
            favorite.delete()
            return JsonResponse({'message': 'Book removed from favorites', 'favorited': False})

    except Books.DoesNotExist:
        return JsonResponse({'error': 'Book not found'}, status=404)
    except Exception as e:
        logger.error(f"Error adding/removing favorite for book {book_id} and user {user.username}: {e}", exc_info=True)
        return JsonResponse({'error': f'An internal server error occurred: {e}'}, status=500)


@csrf_exempt
@login_required
def get_user_favorites(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    user = request.user
    if not hasattr(user, 'customer_profile'):
        return JsonResponse({'error': 'User profile not found.'}, status=400)

    customer = user.customer_profile

    try:
        # Use select_related to fetch book and book__bookauthor__author in one query
        favorites = Favorites.objects.filter(user=customer).select_related('book').prefetch_related(
             'book__bookauthor_set__author'
        )

        favorites_data = []
        for favorite in favorites:
            book = favorite.book
            # Safely get the author name
            book_author = book.bookauthor_set.filter(author__isnull=False).first()
            author_name = book_author.author.name if book_author and book_author.author else "Unknown"

            # Check availability for the favorite book (physical copies)
            available_physical_copies = Bookcopies.objects.filter(
                 book=book,
                 is_borrowed=False,
                 in_inventory=True
            ).count()
            is_available = available_physical_copies > 0 or book.ebook_availability > 0 or book.audiobook_availability > 0


            # Include necessary book details
            favorites_data.append({
                'id': favorite.favorite_id, # The favorite object ID
                'book_id': book.book_id,
                'title': book.title,
                'author': author_name, # Author name
                'cover_path': book.cover_image_url,
                'description': book.description,
                'is_available': is_available, # Indicate if *any* copy (physical or digital) is available
                # Add other details as needed for display in borrowed.html
            })
        return JsonResponse(favorites_data, safe=False)
    except Customer.DoesNotExist:
         return JsonResponse({'error': 'User profile not found.'}, status=404)
    except Exception as e:
        logger.error(f"Error fetching user favorites for user {user.username}: {e}", exc_info=True)
        return JsonResponse({'error': f'An internal server error occurred: {e}'}, status=500)



@csrf_exempt
@login_required
def get_current_user_borrowings(request):
    """
    Fetches the currently borrowed books for the logged-in user.
    Includes is_favorited status for each book.
    """
    if request.method != 'GET':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    user = request.user
    if not hasattr(user, 'customer_profile'):
        logger.warning(f"Attempted to get current borrowings for user {user.username} without customer profile.")
        return JsonResponse({'error': 'User profile not found. Please ensure your account has a customer profile.'}, status=400)

    customer = user.customer_profile
    logger.info(f"Fetching current borrowings for user: {user.username} (Customer ID: {customer.pk})")

    try:
        # Fetch borrowings that have no return_date (currently borrowed)
        # Use select_related to get the related copy, book, and user__membership_type efficiently
        current_borrowings = Borrowings.objects.filter(
            user=customer,
            return_date__isnull=True
        ).select_related('copy__book', 'user__membership_type') # Select related membership type via user

        borrowings_data = []
        # Pre-fetch favorite book IDs for the current user to optimize the loop
        favorited_book_ids = Favorites.objects.filter(user=customer).values_list('book__book_id', flat=True)
        favorited_book_ids_set = set(favorited_book_ids) # Use a set for faster lookups

        for borrowing in current_borrowings:
            book = borrowing.copy.book
            # Safely get the author name
            book_author = book.bookauthor_set.filter(author__isnull=False).first()
            author_name = book_author.author.name if book_author and book_author.author else "Unknown"

            # Get membership type details for borrow duration and renewal rules
            membership_type = customer.membership_type # Use the customer's membership type
            # Default values if membership type is None or attributes are not set
            borrow_duration_days = getattr(membership_type, 'borrow_duration_in_days', 14) if membership_type else 14
            renewal_duration_days = getattr(membership_type, 'renewal_duration_in_days', 14) if membership_type else 14
            max_renewals = getattr(membership_type, 'max_renewal_count', 2) if membership_type else 2


            # Calculate the current due date based on borrow_date or last_renewal_date
            # This is the actual date the book is due
            current_calculated_due_date = borrowing.borrow_date + timezone.timedelta(days=borrow_duration_days)
            if borrowing.last_renewal_date:
                 current_calculated_due_date = borrowing.last_renewal_date + timezone.timedelta(days=renewal_duration_days)


            # Determine status relative to *today*
            today = timezone.now().date()
            # Calculate days left until the current calculated due date
            days_left = (current_calculated_due_date.date() - today).days


            is_overdue = days_left < 0
            due_soon = days_left >= 0 and days_left <= 3

            # --- ADDED: Check if the book is favorited by the user ---
            is_favorited = book.book_id in favorited_book_ids_set
            # --- END ADDED ---

            # Debugging log for renewal counts (keep or remove as needed)
            logger.debug(f"Borrowing ID {borrowing.borrowing_id}: current_renew_count={borrowing.current_renew_count}, max_renewal_count={max_renewals}, is_favorited={is_favorited}")


            borrowings_data.append({
                'id': borrowing.borrowing_id, # Corrected: Use borrowing_id
                'book_id': book.book_id,
                'book_title': book.title,
                'book_author': author_name,
                'book_cover_path': book.cover_image_url,
                # Use the stored borrow_date and the *calculated* current_calculated_due_date for display
                'borrow_date': borrowing.borrow_date.strftime('%Y-%m-%dT%H:%M:%SZ') if borrowing.borrow_date else None,
                'due_date': current_calculated_due_date.strftime('%Y-%m-%dT%H:%M:%SZ') if current_calculated_due_date else None,
                'return_date': borrowing.return_date.strftime('%Y-%m-%dT%H:%M:%SZ') if borrowing.return_date else None, # Should be null for current borrows
                'current_renew_count': borrowing.current_renew_count,
                'max_renewal_count': max_renewals, # Pass max renewals to frontend
                'format': borrowing.format,
                'is_overdue': is_overdue,
                'due_soon': due_soon,
                'days_until_due': days_left,
                # Pass whether the book can be renewed
                'can_renew': borrowing.current_renew_count < max_renewals and not is_overdue,
                'is_favorited': is_favorited, # *** ADDED THIS FIELD ***
            })

        # Optional: Sort current borrowings by due date
        borrowings_data.sort(key=lambda x: x['due_date'] or '9999-12-31T00:00:00Z') # Sort by due date, nulls last

        return JsonResponse(borrowings_data, safe=False)

    except Customer.DoesNotExist:
         logger.error(f"Customer profile not found for authenticated user {user.username} while fetching current borrowings.", exc_info=True)
         return JsonResponse({'error': 'User profile not found.'}, status=404)
    except Exception as e:
        logger.error(f"Error fetching current borrowings for user {user.username}: {e}", exc_info=True)
        return JsonResponse({'error': f'An internal server error occurred while fetching borrowed books: {e}'}, status=500)


# Existing get_user_borrowing_history function, modified to include is_favorited
@csrf_exempt
@login_required
def get_user_borrowing_history(request):
    """
    Fetches the borrowing history for the logged-in user.
    Includes is_favorited status for each book.
    """
    if request.method != 'GET':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    user = request.user
    if not hasattr(user, 'customer_profile'):
        logger.warning(f"Attempted to get borrowing history for user {user.username} without customer profile.")
        return JsonResponse({'error': 'User profile not found.'}, status=400)

    customer = user.customer_profile
    logger.info(f"Fetching borrowing history for user: {user.username} (Customer ID: {customer.pk})")

    try:
        # Fetch borrowings that have a return_date (borrowing history)
        # Order by return date descending
        history_borrowings = Borrowings.objects.filter(
            user=customer,
            return_date__isnull=False
        ).select_related('copy__book').order_by('-return_date')

        history_data = []
        # Pre-fetch favorite book IDs for the current user to optimize the loop
        favorited_book_ids = Favorites.objects.filter(user=customer).values_list('book__book_id', flat=True)
        favorited_book_ids_set = set(favorited_book_ids) # Use a set for faster lookups


        for borrowing in history_borrowings:
            book = borrowing.copy.book
            # Safely get the author name
            book_author = book.bookauthor_set.filter(author__isnull=False).first()
            author_name = book_author.author.name if book_author and book_author.author else "Unknown"

            # Get membership type details to calculate potential fines
            # We need the membership type *at the time of return* ideally, but using current is a simplification.
            # A more complex system would store membership details with the borrowing or calculate fines differently.
            membership_type = customer.membership_type
            overdue_fee = getattr(membership_type, 'overdue_fee_in_dollars', 0) if membership_type else 0
            borrow_duration_days = getattr(membership_type, 'borrow_duration_in_days', 14) if membership_type else 14
            renewal_duration_days = getattr(membership_type, 'renewal_duration_in_days', 14) if membership_type else 14

            # Calculate the due date (considering renewals if any occurred)
            # If last_renewal_date exists, the due date was relative to that plus renewal_duration_days.
            # Otherwise, it was relative to borrow_date plus borrow_duration_days.
            # Need to reconstruct the *final* due date this borrowing was supposed to have before returning.
            # This is a bit tricky - the 'due_date' field on the Borrowings model should store the current final due date.
            # Assuming the 'due_date' field on the Borrowings model was correctly updated during renewals and on initial borrow.
            final_due_date = borrowing.due_date # Use the due_date stored on the model


            # Determine if returned late by comparing the return_date to the final_due_date
            returned_late = False
            fine_amount = 0
            if borrowing.return_date and final_due_date:
                 # Use .date() to compare just the date parts
                 if borrowing.return_date.date() > final_due_date.date():
                     returned_late = True
                     days_overdue = (borrowing.return_date.date() - final_due_date.date()).days
                     fine_amount = days_overdue * overdue_fee
                     # Ensure fine is not negative
                     fine_amount = max(0, fine_amount)


            # Check if the book was renewed at least once for history display
            was_renewed = borrowing.current_renew_count > 0

            # --- ADDED: Check if the book is favorited by the user ---
            is_favorited = book.book_id in favorited_book_ids_set
            # --- END ADDED ---

            # Debugging log for history item data
            logger.debug(f"History Borrowing ID {borrowing.borrowing_id}: Returned Late={returned_late}, Fine=${fine_amount:.2f}, Was Renewed={was_renewed}, is_favorited={is_favorited}")


            history_data.append({
                'id': borrowing.borrowing_id, # Use borrowing_id
                'book_id': book.book_id,
                'book_title': book.title,
                'book_author': author_name,
                'book_cover_path': book.cover_image_url,
                'borrow_date': borrowing.borrow_date.strftime('%Y-%m-%dT%H:%M:%SZ') if borrowing.borrow_date else None,
                # Use the final calculated due date for history display
                'due_date': final_due_date.strftime('%Y-%m-%dT%H:%M:%SZ') if final_due_date else None,
                'return_date': borrowing.return_date.strftime('%Y-%m-%dT%H:%M:%SZ') if borrowing.return_date else None,
                'format': borrowing.format,
                'returned_late': returned_late, # Pass boolean
                'fine_amount': float(f'{fine_amount:.2f}'), # Pass formatted fine as float
                'renewed': was_renewed, # Pass boolean
                'current_renew_count': borrowing.current_renew_count, # Include used count for history detail/modal
                'max_renewal_count': getattr(membership_type, 'max_renewal_count', 2) if membership_type else 2, # Include max for history detail/modal
                 # The last_renewal_date might be useful for modal display in history
                'last_renewal_date': borrowing.last_renewal_date.strftime('%Y-%m-%dT%H:%M:%SZ') if borrowing.last_renewal_date else None,
                'is_favorited': is_favorited, # *** ADDED THIS FIELD ***
            })

        # History is already ordered by return_date descending by the query

        return JsonResponse(history_data, safe=False)

    except Customer.DoesNotExist:
         logger.error(f"Customer profile not found for authenticated user {user.username} while fetching borrowing history.", exc_info=True)
         return JsonResponse({'error': 'User profile not found.'}, status=404)
    except Exception as e:
        logger.error(f"Error fetching borrowing history for user {user.username}: {e}", exc_info=True)
        return JsonResponse({'error': f'An internal server error occurred while fetching borrowing history: {e}'}, status=500)



@csrf_exempt # Consider if you need csrf_exempt here or handle CSRF properly
@login_required
@require_POST
def renew_book(request, borrowing_id):
    """
    Handles the renewal of a borrowed book.
    """
    user = request.user
    if not hasattr(user, 'customer_profile'):
        return JsonResponse({'error': 'User profile not found.'}, status=400)

    customer = user.customer_profile

    try:
        # Get the borrowing record, ensure it belongs to the user and is not yet returned
        # Use select_related to get membership_type for renewal rules
        borrowing = get_object_or_404(
            Borrowings.objects.filter(user=customer, return_date__isnull=True).select_related('user__membership_type'),
            pk=borrowing_id
        )

        # Get membership type details for renewal rules
        membership_type = customer.membership_type # Use the customer's membership type
        # Default values if membership type is None or attributes are not set
        max_renewals = getattr(membership_type, 'max_renewal_count', 2) if membership_type else 2
        renewal_duration_days = getattr(membership_type, 'renewal_duration_in_days', 14) if membership_type else 14
        borrow_duration_days = getattr(membership_type, 'borrow_duration_in_days', 14) if membership_type else 14 # Need initial borrow duration


        # Calculate the current due date based on the last renewal date or borrow date if no renewals yet
        current_due_date_base = borrowing.last_renewal_date if borrowing.last_renewal_date else borrowing.borrow_date
        # If last_renewal_date exists, the current period duration is renewal_duration_days
        # If not, the current period duration is borrow_duration_days
        current_period_duration = renewal_duration_days if borrowing.last_renewal_date else borrow_duration_days
        current_calculated_due_date = current_due_date_base + timezone.timedelta(days=current_period_duration)


        # Check if the book is already overdue (prevent renewal if overdue)
        if current_calculated_due_date < timezone.now():
            return JsonResponse({'error': 'Cannot renew an overdue book. Please return it.'}, status=400)

        # Perform the renewal within a transaction
        with transaction.atomic():
            # Update borrowing record
            borrowing.current_renew_count += 1
            borrowing.last_renewal_date = timezone.now()
            # Calculate new due date from the last renewal date
            borrowing.due_date = borrowing.last_renewal_date + timezone.timedelta(days=renewal_duration_days) # Update the due_date field
            borrowing.save()

        # Log successful renewal
        logger.info(f"Book borrowing {borrowing_id} renewed by user {user.username}. New due date: {borrowing.due_date}")

        # Return updated borrowing information for frontend update
        # Re-fetch the updated borrowing to ensure data is correct (optional but safer)
        updated_borrowing = Borrowings.objects.select_related('copy__book', 'user__membership_type').get(pk=borrowing.borrowing_id)
        book = updated_borrowing.copy.book
        book_author = book.bookauthor_set.filter(author__isnull=False).first()
        author_name = book_author.author.name if book_author and book_author.author else "Unknown"

        # Recalculate days left and status for the updated borrowing
        updated_today = timezone.now().date()
        updated_days_left = (updated_borrowing.due_date.date() - updated_today).days
        updated_is_overdue = updated_days_left < 0
        updated_due_soon = updated_days_left >= 0 and updated_days_left <= 3

        # Get updated max renewals in case membership changed
        updated_membership_type = updated_borrowing.user.membership_type
        updated_max_renewals = getattr(updated_membership_type, 'max_renewal_count', 2) if updated_membership_type else 2


        borrowings_data = {
            'id': updated_borrowing.borrowing_id,
            'book_id': book.book_id,
            'book_title': book.title,
            'book_author': author_name,
            'book_cover_path': book.cover_image_url,
            'borrow_date': updated_borrowing.borrow_date.strftime('%Y-%m-%dT%H:%M:%SZ'),
            'due_date': updated_borrowing.due_date.strftime('%Y-%m-%dT%H:%M:%SZ'),
            'return_date': updated_borrowing.return_date.strftime('%Y-%m-%dT%H:%M:%SZ') if updated_borrowing.return_date else None,
            'current_renew_count': updated_borrowing.current_renew_count,
            'max_renewal_count': updated_max_renewals, # Use updated max renewals
            'format': updated_borrowing.format,
            'is_overdue': updated_is_overdue,
            'due_soon': updated_due_soon,
             'days_until_due': updated_days_left,
             'can_renew': updated_borrowing.current_renew_count < updated_max_renewals and not updated_is_overdue, # Update can_renew status
        }

        return JsonResponse({'message': 'Book renewed successfully', 'borrowing': borrowings_data})

    except Borrowings.DoesNotExist:
        return JsonResponse({'error': 'Borrowing record not found or already returned.'}, status=404)
    except Exception as e:
        logger.error(f"Error renewing book borrowing {borrowing_id} for user {user.username}: {e}", exc_info=True)
        return JsonResponse({'error': f'An internal server error occurred while trying to renew the book: {e}'}, status=500)



@csrf_exempt # Keep csrf_exempt for this test if needed, but recommended to handle CSRF
@login_required
@require_POST
def return_book(request, borrowing_id):
    """
    Handles the return of a borrowed book.
    """
    user = request.user
    if not hasattr(user, 'customer_profile'):
        return JsonResponse({'error': 'User profile not found.'}, status=400)

    customer = user.customer_profile

    try:
        # Get the borrowing record, ensure it belongs to the user and is not yet returned
        # Use select_related to get membership_type for fine calculation if needed
        borrowing = get_object_or_404(
            Borrowings.objects.filter(user=customer, return_date__isnull=True).select_related('user__membership_type'),
            pk=borrowing_id
        )

        # Perform the return within a transaction
        with transaction.atomic():
            # Update borrowing record
            return_date = timezone.now()
            borrowing.return_date = return_date
            borrowing.save()

            # Update associated book copy
            book_copy = borrowing.copy
            book_copy.is_borrowed = False
            book_copy.borrower = None # Remove the borrower link
            book_copy.save()

            # Check if returned late (comparing return_date to due_date)
            returned_late = False
            fine_amount = 0.0

            # Ensure both dates exist before comparing
            if borrowing.return_date and borrowing.due_date and borrowing.return_date > borrowing.due_date:
                 returned_late = True
                 # Calculate fine if needed
                 membership_type = customer.membership_type
                 if membership_type and membership_type.overdue_fee_in_dollars is not None:
                      # Calculate days overdue
                      # Use .date() to compare just the date part
                      days_overdue = (borrowing.return_date.date() - borrowing.due_date.date()).days
                      # Ensure days overdue is non-negative, although calculation should handle this if return_date > due_date
                      days_overdue = max(0, days_overdue)
                      fine_amount = days_overdue * membership_type.overdue_fee_in_dollars
                      # You would typically save this fine amount somewhere, e.g., a Fines model
                      # For now, just returning the information.

        # Log successful return
        logger.info(f"Book borrowing {borrowing_id} returned by user {user.username}. Returned late: {returned_late}, Fine: ${fine_amount:.2f}")

        return JsonResponse({'message': 'Book returned successfully', 'returned_late': returned_late, 'fine_amount': fine_amount})

    except Borrowings.DoesNotExist:
        logger.warning(f"Attempted to return borrowing {borrowing_id} not found or already returned for user {user.username}")
        return JsonResponse({'error': 'Borrowing record not found or already returned.'}, status=404)
    except Exception as e:
        logger.error(f"Error returning book borrowing {borrowing_id} for user {user.username}: {e}", exc_info=True)
        return JsonResponse({'error': f'An internal server error occurred while trying to return the book: {e}'}, status=500)