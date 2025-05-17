# This is an auto-generated Django model module, fixed for Django management and relationships.
from django.db import models
from django.utils import timezone
from django.contrib.auth.models import User # Import Django's built-in User model
from datetime import timedelta
import random
import string

# Helper function for default datetime string if needed, but DateTimeField is better.
# However, using auto_now_add/auto_now is the idiomatic Django way.
# If you truly need a string, you'd handle conversion on save or in properties.
# We'll use DateTimeField below.

# --- Application Specific Models (Managed by Django) ---

class Authors(models.Model):
    # No need to specify primary_key=True, Django adds an 'id' AutoField by default.
    # However, keeping author_id if it matches an existing DB column.
    author_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255) # Changed from TextField
    biography = models.TextField(blank=True, null=True)
    photo_url = models.URLField(max_length=500, blank=True, null=True) # Changed from TextField

    class Meta:
        managed = True # Let Django manage this table
        db_table = 'Authors' # Keep existing table name if migrating from old DB

    def __str__(self):
        return self.name


class Genres(models.Model):
    genre_id = models.AutoField(primary_key=True)
    name = models.CharField(unique=True, max_length=100) # Changed from TextField
    description = models.TextField(blank=True, null=True)

    class Meta:
        managed = True # Let Django manage this table
        db_table = 'Genres' # Keep existing table name

    def __str__(self):
        return self.name


class Publisher(models.Model):
    publisher_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255) # Changed from TextField

    class Meta:
        managed = True # Let Django manage this table
        db_table = 'Publisher' # Keep existing table name

    def __str__(self):
        return self.name


class Membershiptypes(models.Model):
    membership_type_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100) # Changed from TextField
    description = models.TextField(blank=True, null=True)
    borrow_duration_in_days = models.IntegerField()
    same_book_borrow_count_limit = models.IntegerField()
    max_renewal_count = models.IntegerField()
    renewal_duration_in_days = models.IntegerField()
    overdue_fee_in_dollars = models.FloatField()

    class Meta:
        managed = True # Let Django manage this table
        db_table = 'MembershipTypes' # Keep existing table name

    def __str__(self):
        return self.name


class Notificationcategories(models.Model):
    notification_category_id = models.AutoField(primary_key=True)
    name = models.CharField(unique=True, max_length=100) # Changed from TextField
    priority = models.IntegerField(blank=True, null=True) # Integer is fine for priority

    class Meta:
        managed = True # Let Django manage this table
        db_table = 'NotificationCategories' # Keep existing table name

    def __str__(self):
        return self.name


class Books(models.Model):
    book_id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=255) # Changed from TextField
    isbn = models.CharField(unique=True, max_length=20) # Changed from TextField, added max_length
    publication_year = models.IntegerField(blank=True, null=True)
    publisher = models.ForeignKey(Publisher, on_delete=models.SET_NULL, blank=True, null=True) # Added on_delete
    cover_image_url = models.URLField(max_length=500, blank=True, null=True) # Changed from TextField
    page_count = models.IntegerField(blank=True, null=True)
    language = models.CharField(max_length=50, blank=True, null=True) # Changed from TextField
    description = models.TextField(blank=True, null=True) # Keep as TextField
    added_date = models.DateTimeField(auto_now_add=True, null=True) # Changed from TextField, use DateTimeField and auto_now_add
    is_deleted = models.BooleanField(default=False) # Changed from IntegerField
    deleted_at = models.DateTimeField(blank=True, null=True) # Changed from TextField
    ebook_availability = models.BooleanField(default=False, blank=True, null=True)
    audiobook_availability = models.BooleanField(default=False, blank=True, null=True)
    class Meta:
        managed = True # Let Django manage this table
        db_table = 'Books' # Keep existing table name

    def __str__(self):
        return self.title


class Bookauthor(models.Model):
    # Django automatically adds 'id' as primary key unless you specify primary_key=True on another field.
    # Keeping bookauthor_id if it exists in the old schema.
    bookauthor_id = models.AutoField(primary_key=True)
    book = models.ForeignKey(Books, on_delete=models.CASCADE, blank=True, null=True) # Added on_delete
    author = models.ForeignKey(Authors, on_delete=models.CASCADE, blank=True, null=True) # Added on_delete

    class Meta:
        managed = True # Let Django manage this table
        db_table = 'BookAuthor' # Keep existing table name
        # Add unique_together if a book can only have an author listed once in this table
        # unique_together = (('book', 'author'),)


class Bookgenre(models.Model):
    # Keeping bookgenre_id if it exists in the old schema.
    bookgenre_id = models.AutoField(primary_key=True)
    book = models.ForeignKey(Books, on_delete=models.CASCADE, blank=True, null=True) # Added on_delete
    genre = models.ForeignKey(Genres, on_delete=models.CASCADE, blank=True, null=True) # Added on_delete

    class Meta:
        managed = True # Let Django manage this table
        db_table = 'BookGenre' # Keep existing table name
        # Add unique_together if a book can only have a genre listed once in this table
        # unique_together = (('book', 'genre'),)


class Bookcopies(models.Model):
    copy_id = models.AutoField(primary_key=True)
    book = models.ForeignKey(Books, on_delete=models.CASCADE, blank=True, null=True) # Added on_delete
    format = models.CharField(max_length=50) # Changed from TextField (e.g., 'Hardcover', 'Paperback', 'eBook')
    is_borrowed = models.BooleanField(default=False) # Changed from IntegerField
    # borrower refers to the Customer profile linked to the auth.User
    borrower = models.ForeignKey('Customer', on_delete=models.SET_NULL, blank=True, null=True) # Corrected ForeignKey to Customer
    in_inventory = models.BooleanField(default=True) # Changed from IntegerField, assuming it's in inventory by default


    class Meta:
        managed = True # Let Django manage this table
        db_table = 'BookCopies' # Keep existing table name


class Customer(models.Model):
    # Links to Django's built-in User model
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE, # If a User is deleted, delete the Customer profile
        primary_key=True, # Use the User's primary key as the primary key for Customer
        related_name='customer_profile' # Allows accessing Customer from User: user_instance.customer_profile
    )
    # Consider using choices for roles if they are fixed values
    role = models.IntegerField(default=0)
    profile_picture_url = models.URLField(max_length=500, blank=True, null=True) # Changed from TextField

    # Fields from the old Users model that might be relevant to a customer profile:
    is_a_member = models.BooleanField(default=False)
    membership_last_renewed = models.DateTimeField(blank=True, null=True)
    # Assuming MembershipTypes is still relevant
    membership_type = models.ForeignKey(Membershiptypes, on_delete=models.SET_NULL, blank=True, null=True) # Added on_delete
    bio = models.TextField(blank=True, null=True)
    # created_at is covered by User.date_joined
    # last_login is covered by User.last_login
    last_seen = models.DateTimeField(blank=True, null=True)
    is_subbed_to_newsletter = models.BooleanField(default=False)
    theme_preference = models.CharField(max_length=50, blank=True, null=True) # Changed from TextField
    # is_deleted and deleted_at could be handled here or rely on auth.User's is_active if that suffices
    is_deleted = models.BooleanField(default=False) # Keep if separate soft delete is needed
    deleted_at = models.DateTimeField(blank=True, null=True) # Keep if separate soft delete is needed


    class Meta:
        managed = True # Let Django manage this table
        # If you are migrating from an existing 'Users' table, keep db_table.
        # Otherwise, remove db_table to let Django name it 'yourapp_customer'.
        db_table = 'Users'

    def __str__(self):
        # Use the related User's username
        return self.user.username if self.user else f"Customer (ID: {self.pk})"


class Admin(models.Model):
    # Links to Django's built-in User model
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE, # If a User is deleted, delete the Admin profile
        primary_key=True, # Use the User's primary key as the primary key for Admin
        related_name='admin_profile' # Allows accessing Admin from User: user_instance.admin_profile
    )
    # Add any admin-specific fields here
    profile_picture_url = models.URLField(max_length=500, blank=True, null=True) # Changed from TextField


    class Meta:
        managed = True # Let Django manage this table
        # If you are migrating from an existing 'Admins' table, keep db_table.
        # Otherwise, remove db_table to let Django name it 'yourapp_admin'.
        db_table = 'Admins'

    def __str__(self):
        # Use the related User's username
        return f"Admin: {self.user.username}" if self.user else f"Admin (ID: {self.pk})"


class Borrowings(models.Model):
    borrowing_id = models.AutoField(primary_key=True)
    # User who borrowed
    user = models.ForeignKey(Customer, on_delete=models.CASCADE) # Changed to Customer, added on_delete
    # Specific copy borrowed (OneToOne means a copy can only be in ONE active borrowing at a time)
    copy = models.ForeignKey(Bookcopies, on_delete=models.PROTECT)
    # format is already on Bookcopies, might be redundant here unless this indicates borrow format.
    # Keeping for now based on original schema, but consider if needed.
    format = models.CharField(max_length=50) # Changed from TextField, should match copy format
    borrow_date = models.DateTimeField(default=timezone.now) # Changed from TextField, use DateTimeField with a default
    due_date = models.DateTimeField(blank=True, null=True) # Changed from TextField
    return_date = models.DateTimeField(blank=True, null=True) # Changed from TextField
    current_renew_count = models.IntegerField(default=0) # Added default
    last_renewal_date = models.DateTimeField(blank=True, null=True) # Changed from TextField
    notes = models.TextField(blank=True, null=True)

    class Meta:
        managed = True # Let Django manage this table
        db_table = 'Borrowings' # Keep existing table name


class Favorites(models.Model):
    favorite_id = models.AutoField(primary_key=True)
    # User who favorited
    user = models.ForeignKey(Customer, on_delete=models.CASCADE) # Changed to Customer, added on_delete
    book = models.ForeignKey(Books, on_delete=models.CASCADE) # Added on_delete
    created_at = models.DateTimeField(auto_now_add=True) # Changed from TextField, use DateTimeField and auto_now_add

    class Meta:
        managed = True # Let Django manage this table
        db_table = 'Favorites' # Keep existing table name
        # A user can only favorite a book once
        unique_together = (('user', 'book'),)


class Friendships(models.Model):
    friendship_id = models.AutoField(primary_key=True)
    # Users involved in the friendship
    user_1 = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='friendships_initiated') # Changed to Customer, added on_delete and related_name
    user_2 = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='friendships_received') # Changed to Customer, added on_delete
    status = models.CharField(max_length=20) # Changed from TextField (e.g., 'pending', 'accepted', 'declined')
    created_at = models.DateTimeField(auto_now_add=True) # Changed from TextField, use DateTimeField and auto_now_add

    class Meta:
        managed = True # Let Django manage this table
        db_table = 'Friendships' # Keep existing table name
        # Ensure uniqueness and prevent (user1, user2) and (user2, user1) being different rows
        # Consider adding a constraint or handling this in application logic
        unique_together = (('user_1', 'user_2'),)


class Globalparameters(models.Model):
    # Standard Django primary key
    id = models.AutoField(primary_key=True)
    # user_id seems out of place for 'GlobalParameters', removed it.
    # Add actual global parameters fields here, e.g.:
    # site_name = models.CharField(max_length=255)
    # items_per_page = models.IntegerField(default=10)
    # If this is meant to store *user-specific* parameters,
    # rename it (e.g., UserParameters) and link to Customer:
    # user = models.OneToOneField(Customer, on_delete=models.CASCADE, primary_key=True)
    # parameter_name = models.CharField(...)
    # parameter_value = models.TextField(...)
    # ... or fields for each parameter directly on the Customer model if they are few.

    class Meta:
        managed = True # Let Django manage this table
        db_table = 'GlobalParameters' # Keep existing table name


class Notifications(models.Model):
    notification_id = models.AutoField(primary_key=True)
    # User receiving the notification
    user = models.ForeignKey(Customer, on_delete=models.CASCADE, blank=True, null=True) # Changed to Customer, added on_delete
    notification_category = models.ForeignKey(Notificationcategories, on_delete=models.CASCADE) # Added on_delete
    message = models.TextField() # Keep as TextField
    timestamp = models.DateTimeField(auto_now_add=True) # Changed from TextField, use DateTimeField and auto_now_add
    is_read = models.BooleanField(default=False) # Changed from IntegerField

    class Meta:
        managed = True # Let Django manage this table
        db_table = 'Notifications' # Keep existing table name


class Ratings(models.Model):
    rating_id = models.AutoField(primary_key=True)
    # User giving the rating
    user = models.ForeignKey(Customer, on_delete=models.CASCADE) # Changed to Customer, added on_delete
    book = models.ForeignKey(Books, on_delete=models.CASCADE) # Added on_delete
    value = models.IntegerField() # Integer is fine for the rating value (e.g., 1-5)
    timestamp = models.DateTimeField(auto_now_add=True) # Changed from TextField, use DateTimeField and auto_now_add

    class Meta:
        managed = True # Let Django manage this table
        db_table = 'Ratings' # Keep existing table name
        # A user can only rate a book once
        unique_together = (('user', 'book'),)



#  password reset

class PasswordResetToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    token = models.CharField(max_length=6, unique=True) # Store the 6-digit code
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField() # Will be calculated in save method
    is_used = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        # Calculate expires_at before saving if it's not set
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(minutes=15) # Code expires in 15 minutes
        super().save(*args, **kwargs)

    def is_valid(self):
        """Checks if the token is not used and not expired."""
        return not self.is_used and self.expires_at > timezone.now()

    def __str__(self):
        return f"Token for {self.user.username}: {self.token}"