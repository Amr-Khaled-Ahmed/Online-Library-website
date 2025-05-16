# views.py
import random
import string
import traceback


from django.db.models import Q
# from django.db.models.fields import json
from django.shortcuts import render, redirect
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
            Q(isbn=query) |
            Q(bookauthor__author__name__icontains=query)
        )

    if genre:
        books = books.filter(bookgenre__genre__name__iexact=genre)

    if sort == 'newest':
        books = books.order_by('-publication_year')
    elif sort == 'oldest':
        books = books.order_by('publication_year')
    elif sort == 'title-asc':
        books = books.order_by('title')
    elif sort == 'title-desc':
        books = books.order_by('-title')
    elif sort == 'author-asc':
        books = books.order_by('bookauthor__author__name')
    elif sort == 'author-desc':
        books = books.order_by('-bookauthor__author__name')

    enriched_books = []

    for book in books:
        authors = [ba.author for ba in book.bookauthor_set.all()]
        genres = [bg.genre for bg in book.bookgenre_set.all()]
        book_copies = book.bookcopies_set.all()
        book_copies_count = book_copies.count()

        borrowers = []
        for copy in book_copies:
            try:
                borrowing = Borrowings.objects.get(copy=copy, return_date__isnull=True)
                if borrowing.user and borrowing.user not in borrowers:
                    borrowers.append(borrowing.user)
            except Borrowings.DoesNotExist:
                continue

        enriched_books.append({
            'book': book,
            'authors': authors,
            'genres': genres,
            'copies_count': book_copies_count,
            'borrowers_count': len(borrowers)
        })

    if availability == 'unavailable':
        enriched_books = [book for book in enriched_books if book['copies_count'] == 0]
    elif availability == 'low-stock':
        enriched_books = [book for book in enriched_books if book['copies_count'] <= 10 and book['copies_count'] > 0]
    elif availability == 'available':
        enriched_books = [book for book in enriched_books if book['copies_count'] > 10]

    if sort == 'popular':
        enriched_books = sorted(enriched_books, key=lambda x: x['borrowers_count'], reverse=True)

    return render(request, 'frontend/pages/admin_dashboard.html', {'books': enriched_books})


@login_required  # Ensure user is logged in to view profile
def profile(request):
    user = request.user
    customer = None
    books_borrowed_count = 0
    books_favorited_count = 0
    # Get join year safely, defaulting if user.date_joined is None
    member_since_year = user.date_joined.year if user.date_joined else 'N/A'

    if hasattr(user, 'customer_profile'):
        customer = user.customer_profile
        # Fetch counts from the database using the Customer object
        # Wrap in try/except to handle missing tables temporarily
        try:
            # Ensure Borrowings and Favorites models are imported at the top
            books_borrowed_count = Borrowings.objects.filter(user=customer,
                                                             return_date__isnull=True).count()  # Count currently borrowed books
            books_favorited_count = Favorites.objects.filter(user=customer).count()  # Count favorite books
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

    # Determine if the user is an admin
    is_admin = hasattr(user, 'admin_profile') or user.is_superuser

    context = {
        'user': user,  # Django's built-in User object
        'customer': customer,  # Our custom Customer profile object
        'books_borrowed_count': books_borrowed_count,
        'books_favorited_count': books_favorited_count,
        'member_since_year': member_since_year,
        'is_admin': is_admin,  # Pass the admin status to the template
    }
    return render(request, 'frontend/pages/profile.html', context)


def book_details(request):
    return render(request, 'frontend/pages/book_details.html')


def borrowed(request):
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
                    Customer.objects.create(
                        user=user,
                        role=0  # Assuming 0 is customer role
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
    if not hasattr(request.user, 'customer_profile'):
        messages.error(request, 'You do not have permission to access the user dashboard')
        return redirect('home')  # Or redirect to profile with a message

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
@require_POST  # Only allow POST requests for updating picture
def update_profile_picture(request):
    """Handles uploading or clearing the user's profile picture."""
    user = request.user

    # Ensure the user has a customer profile before proceeding
    if not hasattr(user, 'customer_profile'):
        messages.error(request, 'User profile not found.')
        return JsonResponse({'success': False, 'message': 'User profile not found'}, status=400)

    customer = user.customer_profile  # Get the related Customer object

    if 'profile_picture' in request.FILES:
        # Handle uploading a new profile picture
        uploaded_file = request.FILES['profile_picture']
        fs = FileSystemStorage()

        # Optional: Delete the old file if it exists
        if customer.profile_picture_url:
            try:
                old_file_path = os.path.join(settings.MEDIA_ROOT,
                                             customer.profile_picture_url.replace(settings.MEDIA_URL, '', 1))
                if os.path.exists(old_file_path):
                    os.remove(old_file_path)
            except Exception as e:
                logger.error(f"Error deleting old profile picture file for user {user.username}: {e}")

        # Save the new file
        # You might want a more robust naming strategy (e.g., using user ID)
        filename = fs.save(os.path.join('profile_pictures', uploaded_file.name), uploaded_file)

        # Get the URL to the saved file
        file_url = fs.url(filename)

        # Update the profile_picture_url in the Customer model
        customer.profile_picture_url = file_url
        try:
            customer.save()
            messages.success(request, 'Profile picture updated successfully!')
            return JsonResponse({'success': True, 'profile_picture_url': file_url})  # Return JSON for AJAX
        except Exception as e:
            logger.error(f"Error saving profile picture URL for user {user.username}: {e}", exc_info=True)
            messages.error(request, 'Failed to save profile picture to database.')
            return JsonResponse({'success': False, 'message': 'Failed to save profile picture to database.'},
                                status=500)


    elif request.POST.get('clear_picture') == 'true':
        # Handle clearing the profile picture
        if customer.profile_picture_url:
            # Optional: Delete the old file from storage
            try:
                # Get the path from the URL and delete the file
                file_path = os.path.join(settings.MEDIA_ROOT,
                                         customer.profile_picture_url.replace(settings.MEDIA_URL, '', 1))
                if os.path.exists(file_path):
                    os.remove(file_path)
            except Exception as e:
                logger.error(f"Error deleting old profile picture file for user {user.username}: {e}")

            customer.profile_picture_url = None
            try:
                customer.save()
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
                language='en',
                description=description,
                added_date=timezone.now().strftime('%Y-%m-%d %H:%M:%S'),
            )

            Bookauthor.objects.create(
                book=new_book,
                author=author
            )

            Bookgenre.objects.create(
                book=new_book,
                genre=genre
            )

            return JsonResponse({'message': 'Book added successfully'})
        except Exception as e:
            print(traceback.format_exc())
            return JsonResponse({'error': str(e)}, status=400)
    else:
        print(traceback.format_exc())
        return JsonResponse({'error': 'Invalid request method'}, status=405)




@csrf_exempt
def delete_book(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            book_id = data.get('book_id')

            book = Books.objects.get(book_id=book_id, is_deleted=0)

            # Consider using bulk_update or a more efficient way if deleting many related objects
            Bookauthor.objects.filter(book=book).delete()
            Bookgenre.objects.filter(book=book).delete()
            # You might also need to handle Bookcopies and Borrowings related to this book

            book.is_deleted = 1
            book.deleted_at = timezone.now()
            book.save()

            return JsonResponse({'message': 'Book deleted successfully'})
        except Books.DoesNotExist:
            return JsonResponse({'error': 'Book not found or already deleted'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    else:
        return JsonResponse({'error': 'Invalid request method'}, status=405)


def get_book(request, book_id):
    try:
        book = Books.objects.get(book_id=book_id)
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
        }
        return JsonResponse(data)
    except Books.DoesNotExist:
        return JsonResponse({'error': 'Book not found'}, status=404)
    except Exception as e:
        # Catch other potential errors during data retrieval
        print(traceback.format_exc())
        return JsonResponse({'error': str(e)}, status=400)


@csrf_exempt
def edit_book(request, book_id):
    if request.method == 'POST':
        try:
            book = Books.objects.get(book_id=book_id)
            book_author_obj = Bookauthor.objects.filter(book=book).first()
            book_genre_obj = Bookgenre.objects.filter(book=book).first()

            new_book_data = json.loads(request.body)

            book.isbn = new_book_data.get('isbn')
            book.title = new_book_data.get('title').strip().title()

            author_name = new_book_data.get('author').strip().title()
            genre_name = GENRE_MAPPING.get(new_book_data.get('genre'))

            if book_author_obj:
                author_obj, created = Authors.objects.get_or_create(name=author_name)
                book_author_obj.author = author_obj
                book_author_obj.save()
            else:
                # Create a new BookAuthor if one didn't exist
                author_obj, created = Authors.objects.get_or_create(name=author_name)
                Bookauthor.objects.create(book=book, author=author_obj)

            book.cover_image_url = new_book_data.get('coverPath')

            if book_genre_obj:
                genre_obj, created = Genres.objects.get_or_create(name=genre_name)
                book_genre_obj.genre = genre_obj
                book_genre_obj.save()
            else:
                # Create a new BookGenre if one didn't exist
                genre_obj, created = Genres.objects.get_or_create(name=genre_name)
                Bookgenre.objects.create(book=book, genre=genre_obj)

            book.publication_year = new_book_data.get('pubYear')
            book.page_count = new_book_data.get('pageCount')
            book.description = new_book_data.get('description').strip().capitalize()

            book.save()
            return JsonResponse({'message': 'Book updated successfully'})
        except Books.DoesNotExist:
            return JsonResponse({'error': 'Book not found or already deleted'}, status=404)
        except Exception as e:
            print(traceback.format_exc())
            return JsonResponse({'error': str(e)}, status=400)
    else:
        return JsonResponse({'error': 'Invalid request method'}, status=405)


@csrf_exempt  # Keep this if you intend to use it for this view
def add_copies(request):
    if request.method == 'POST':
        try:
            # Retrieve book copies from body of the request
            data = json.loads(request.body)

            bookId = data.get('bookId')
            hardcover = int(data.get('hardcover'))
            paperback = int(data.get('paperback'))
            ebook = data.get('ebook', False)
            audiobook = data.get('audiobook', False)

            book = Books.objects.get(book_id=bookId)

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


            book.ebook_available = ebook
            book.audiobook_available = audiobook
            book.save()

            return JsonResponse({'message': 'Copies and availability updated successfully'})
        except Books.DoesNotExist:
            return JsonResponse({'error': 'Book not found'}, status=404)
        except Exception as e:
            print(traceback.format_exc())
            return JsonResponse({'error': str(e)}, status=400)
    else:
        print(traceback.format_exc())
        return JsonResponse({'error': 'Invalid request method'}, status=405)


@csrf_exempt
def get_book_details(request, book_id):
    try:
        book = Books.objects.get(book_id=book_id, is_deleted=0)
        book_author = Bookauthor.objects.filter(book=book, author__isnull=False).first()
        book_genre = Bookgenre.objects.filter(book=book).first()
        book_copies = Bookcopies.objects.filter(book=book)

        # Check availability
        available_copies = book_copies.filter(is_borrowed=0, in_inventory=1).count()

        data = {
            'id': book.book_id,
            'title': book.title,
            'author': book_author.author.name if book_author else "Unknown",
            'cover_path': book.cover_image_url,
            'genre': GENRE_MAPPING_REV.get(book_genre.genre.name) if book_genre else "Unknown",
            'publication_year': book.publication_year,
            'description': book.description,
            'is_available': available_copies > 0
        }
        return JsonResponse(data)
    except Books.DoesNotExist:
        return JsonResponse({'error': 'Book not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def get_current_user(request):
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Not authenticated'}, status=401)

    try:
        user = User.objects.get(username=request.user.username)
        return JsonResponse({
            'id': user.id,
            'username': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name
        })
    except User.DoesNotExist:
        return JsonResponse({'error': 'User not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def borrow_book(request, book_id):
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Not authenticated'}, status=401)

    try:
        # Ensure the user has a customer profile before proceeding
        if not hasattr(request.user, 'customer_profile'):
             return JsonResponse({'error': 'User profile not found'}, status=400)

        user = request.user.customer_profile # Use the customer profile
        book = Books.objects.get(book_id=book_id, is_deleted=0)

        # Check if user already has this book borrowed
        existing_borrow = Borrowings.objects.filter(
            user=user,
            book=book, # Note: Borrowing model links to copy, not book directly, this query needs adjustment based on your exact Borrowing model fields
            return_date__isnull=True
        ).first()

        # Adjusted query based on Borrowings model linking User (Customer) and Bookcopies
        existing_borrow = Borrowings.objects.filter(
            user=user,
            copy__book=book,
            return_date__isnull=True
        ).first()

        if existing_borrow:
            return JsonResponse({'error': 'You have already borrowed this book'}, status=400)

        # Find available copy
        available_copy = Bookcopies.objects.filter(
            book=book,
            is_borrowed=0,
            in_inventory=1
        ).first()

        if not available_copy:
            return JsonResponse({'error': 'No copies available'}, status=400)

        # Create borrowing record
        # borrow_date = timezone.now().strftime('%Y-%m-%d %H:%M:%S') # Use timezone.now() directly with DateTimeField

        Borrowings.objects.create(
            user=user,
            copy=available_copy,
            # book=book, # Removed this line as Borrowing model links to copy, which links to book
            format=available_copy.format,
            # borrow_date=borrow_date, # Use default=timezone.now in model
            current_renew_count=0
        )

        # Update copy status
        available_copy.is_borrowed = True # Use True/False with BooleanField
        available_copy.borrower = user # Link the copy to the borrowing user (Customer)
        available_copy.save()

        return JsonResponse({'message': 'Book borrowed successfully'})

    except Customer.DoesNotExist: # Changed from Users.DoesNotExist
        return JsonResponse({'error': 'User profile not found'}, status=404)
    except Books.DoesNotExist:
        return JsonResponse({'error': 'Book not found'}, status=404)
    except Exception as e:
        # Log the error for debugging
        logger.error(f"Error borrowing book: {e}", exc_info=True)
        return JsonResponse({'error': 'An internal error occurred'}, status=500) # Generic error for user

@csrf_exempt
def get_books(request):
    try:
        books = Books.objects.filter(is_deleted=0).prefetch_related(
            'bookauthor_set__author',
            'bookgenre_set__genre',
            'bookcopies_set'
        )

        query = request.GET.get('q')
        genre = GENRE_MAPPING.get(request.GET.get('genre'))
        sort = request.GET.get('sort')
        availability = request.GET.get('availability')

        if query:
            books = books.filter(
                Q(title__icontains=query) |
                Q(isbn=query) |
                Q(bookauthor__author__name__icontains=query)
            )

        if genre:
            books = books.filter(bookgenre__genre__name__iexact=genre)

        if sort == 'newest':
            books = books.order_by('-publication_year')
        elif sort == 'oldest':
            books = books.order_by('publication_year')
        elif sort == 'title-asc':
            books = books.order_by('title')
        elif sort == 'title-desc':
            books = books.order_by('-title')
        elif sort == 'author-asc':
            books = books.order_by('bookauthor__author__name')
        elif sort == 'author-desc':
            books = books.order_by('-bookauthor__author__name')

        books_data = []
        for book in books:
            book_author = book.bookauthor_set.filter(author__isnull=False).first()
            book_genre = book.bookgenre_set.first()
            available_copies = book.bookcopies_set.filter(is_borrowed=0, in_inventory=1).count()

            books_data.append({
                'book_id': book.book_id,
                'title': book.title,
                'author_name': book_author.author.name if book_author else "Unknown",
                'cover_image_url': book.cover_image_url,
                'genre_name': book_genre.genre.name if book_genre else "Unknown",
                'publication_year': book.publication_year,
                'description': book.description,
                'is_available': available_copies > 0
            })

        return JsonResponse(books_data, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
















# --- Password Reset Views ---

@csrf_exempt
def send_verification_email_view(request):
    """
    Handles the AJAX request to send a password reset verification email.
    Expects a POST request with JSON data containing the 'username'.
    Generates and saves a verification token and sends an HTML email.
    """
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            username = data.get('username')

            if not username:
                return JsonResponse({'success': False, 'error': 'Username is required.'}, status=400)

            try:
                user = User.objects.get(username=username)

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
                request.session['password_reset_username'] = username


                return JsonResponse({'success': True, 'message': 'Verification code sent to your email.'})

            except User.DoesNotExist:
                 # Generic message for security
                 return JsonResponse({'success': False, 'error': 'If a user with that username exists, a verification email has been sent.'}, status=200)
            except Exception as e:
                # Log the error and print the full traceback
                print(f"Error sending verification email: {e}")
                traceback.print_exc() # <--- This will print the detailed error!
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
            print(f"Verification code attempt for username: {username} with code: {code}")

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

                    return JsonResponse({'success': True, 'message': 'Code verified successfully.'})
                else:
                    return JsonResponse({'success': False, 'error': 'Invalid or expired verification code.'}, status=400)

            except User.DoesNotExist:
                 # Should not happen if username is from session, but handle defensively
                request.session.pop('password_reset_username', None) # Clear session data
                request.session.pop('password_reset_code_verified', None)
                return JsonResponse({'success': False, 'error': 'User not found during code verification.'}, status=404)
            except Exception as e:
                print(f"Error verifying reset code: {e}")
                # Log the traceback for better debugging
                traceback.print_exc() # <--- This will print the detailed error!
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
            print(f"Reset password attempt for username: {username}")
            print(f"Code verified status in session: {code_verified}")


            if not new_password or not username or not code_verified:
                 # Return appropriate error if prerequisites are not met
                 error_message = 'Password and username are required.'
                 if not username:
                      error_message = 'Password reset flow not initiated or session expired. Please start again.'
                 elif not code_verified:
                     error_message = 'Code verification is required before setting a new password. Please go back and verify the code.'

                 # Clear session data if prerequisites are not met unexpectedly
                 request.session.pop('password_reset_username', None)
                 request.session.pop('password_reset_code_verified', None)


                 return JsonResponse({'success': False, 'error': error_message}, status=400)


            try:
                user = User.objects.get(username=username)

                # Use Django's set_password method to handle hashing securely
                user.set_password(new_password)
                user.save()

                # Clear the password reset session data after successful reset
                request.session.pop('password_reset_username', None)
                request.session.pop('password_reset_code_verified', None)


                return JsonResponse({'success': True, 'message': 'Password has been reset successfully. You can now log in with your new password.'})

            except User.DoesNotExist:
                 # This case should ideally not happen if username is from a verified session,
                 # but handle defensively.
                request.session.pop('password_reset_username', None) # Clear session data
                request.session.pop('password_reset_code_verified', None)
                return JsonResponse({'success': False, 'error': 'User not found during password reset.'}, status=404)
            except Exception as e:
                print(f"Error resetting password: {e}")
                # Log the traceback for better debugging
                traceback.print_exc() # <--- This will print the detailed error!
                # Clear session data on error to force restart of reset flow
                request.session.pop('password_reset_username', None)
                request.session.pop('password_reset_code_verified', None)
                return JsonResponse({'success': False, 'error': 'An error occurred while resetting your password. Please try again.'}, status=500)

        except json.JSONDecodeError:
            return JsonResponse({'success': False, 'error': 'Invalid data format. Please send valid JSON.'}, status=400)
    else:
        return JsonResponse({'success': False, 'error': 'Invalid request method. Only POST is allowed.'}, status=405)
