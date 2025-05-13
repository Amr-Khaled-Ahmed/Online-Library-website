from django.db import models


class Authors(models.Model):
    author_id = models.AutoField(primary_key=True)
    name = models.TextField()
    biography = models.TextField(blank=True, null=True)
    photo_url = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'Authors'


class Bookauthor(models.Model):
    book = models.ForeignKey('Books', models.DO_NOTHING)
    author = models.ForeignKey(Authors, models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'BookAuthor'
        unique_together = (('book', 'author'),)


class Bookcopies(models.Model):
    copy_id = models.AutoField(primary_key=True)
    book = models.ForeignKey('Books', models.DO_NOTHING, blank=True, null=True)
    format = models.TextField()
    is_borrowed = models.IntegerField(blank=True, null=True)
    borrower = models.ForeignKey('Users', models.DO_NOTHING, blank=True, null=True)
    in_inventory = models.IntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'BookCopies'


class Bookgenre(models.Model):
    book = models.ForeignKey('Books', models.DO_NOTHING)
    genre = models.ForeignKey('Genres', models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'BookGenre'
        unique_together = (('book', 'genre'),)


class Books(models.Model):
    book_id = models.AutoField(primary_key=True)
    title = models.TextField()
    isbn = models.TextField(unique=True)
    publication_year = models.IntegerField(blank=True, null=True)
    publisher = models.ForeignKey('Publisher', models.DO_NOTHING, blank=True, null=True)
    cover_image_url = models.TextField(blank=True, null=True)
    page_count = models.IntegerField(blank=True, null=True)
    language = models.TextField(blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    added_date = models.TextField()
    is_deleted = models.IntegerField()
    deleted_at = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'Books'


class Borrowings(models.Model):
    borrowing_id = models.AutoField(primary_key=True)
    user = models.ForeignKey('Users', models.DO_NOTHING, blank=True, null=True)
    copy = models.OneToOneField(Bookcopies, models.DO_NOTHING, blank=True, null=True)
    book = models.ForeignKey(Books, models.DO_NOTHING, blank=True, null=True)
    format = models.TextField()
    borrow_date = models.TextField()
    return_date = models.TextField(blank=True, null=True)
    current_renew_count = models.IntegerField(blank=True, null=True)
    last_renewal_date = models.TextField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'Borrowings'


class Credentials(models.Model):
    user = models.OneToOneField('Users', models.DO_NOTHING, primary_key=True)
    password_hash = models.BinaryField()

    class Meta:
        managed = False
        db_table = 'Credentials'


class Favorites(models.Model):
    favorite_id = models.AutoField(primary_key=True)
    user = models.ForeignKey('Users', models.DO_NOTHING, blank=True, null=True)
    book = models.ForeignKey(Books, models.DO_NOTHING, blank=True, null=True)
    created_at = models.TextField()

    class Meta:
        managed = False
        db_table = 'Favorites'


class Friendships(models.Model):
    friendship_id = models.AutoField(primary_key=True)
    user_1 = models.ForeignKey('Users', models.DO_NOTHING, blank=True, null=True)
    user_2 = models.ForeignKey('Users', models.DO_NOTHING, related_name='friendships_user_2_set', blank=True, null=True)
    status = models.TextField()
    created_at = models.TextField()

    class Meta:
        managed = False
        db_table = 'Friendships'


class Genres(models.Model):
    genre_id = models.AutoField(primary_key=True)
    name = models.TextField()
    description = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'Genres'


class Globalparameters(models.Model):
    user_id = models.IntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'GlobalParameters'


class Membershiptypes(models.Model):
    membership_type_id = models.AutoField(primary_key=True)
    name = models.TextField()
    description = models.TextField(blank=True, null=True)
    borrow_duration_in_days = models.IntegerField()
    same_book_borrow_count_limit = models.IntegerField()
    max_renewal_count = models.IntegerField()
    renewal_duration_in_days = models.IntegerField()
    overdue_fee_in_dollars = models.FloatField()

    class Meta:
        managed = False
        db_table = 'MembershipTypes'


class Notificationcategories(models.Model):
    notification_category_id = models.AutoField(primary_key=True)
    name = models.TextField(unique=True)
    priority = models.IntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'NotificationCategories'


class Notifications(models.Model):
    notification_id = models.AutoField(primary_key=True)
    user = models.ForeignKey('Users', models.DO_NOTHING, blank=True, null=True)
    notification_category = models.ForeignKey(Notificationcategories, models.DO_NOTHING)
    message = models.TextField()
    timestamp = models.TextField()
    is_read = models.IntegerField()

    class Meta:
        managed = False
        db_table = 'Notifications'


class Publisher(models.Model):
    publisher_id = models.AutoField(primary_key=True)
    name = models.TextField()

    class Meta:
        managed = False
        db_table = 'Publisher'


class Ratings(models.Model):
    rating_id = models.AutoField(primary_key=True)
    user = models.ForeignKey('Users', models.DO_NOTHING, blank=True, null=True)
    book = models.ForeignKey(Books, models.DO_NOTHING, blank=True, null=True)
    value = models.IntegerField()
    timestamp = models.TextField()

    class Meta:
        managed = False
        db_table = 'Ratings'


class Users(models.Model):
    user_id = models.AutoField(primary_key=True)
    username = models.TextField()
    email = models.TextField(unique=True)
    first_name = models.TextField(blank=True, null=True)
    last_name = models.TextField(blank=True, null=True)
    role = models.IntegerField()
    is_a_member = models.IntegerField()
    membership_last_renewed = models.TextField(blank=True, null=True)
    membership_type = models.ForeignKey(Membershiptypes, models.DO_NOTHING, blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    created_at = models.TextField()
    last_login = models.TextField(blank=True, null=True)
    profile_image_url = models.TextField(blank=True, null=True)
    last_seen = models.TextField(blank=True, null=True)
    is_subbed_to_newsletter = models.IntegerField(blank=True, null=True)
    theme_preference = models.TextField(blank=True, null=True)
    is_deleted = models.IntegerField()
    deleted_at = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'Users'
