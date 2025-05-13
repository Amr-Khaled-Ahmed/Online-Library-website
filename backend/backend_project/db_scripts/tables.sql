BEGIN TRANSACTION;

CREATE TABLE Publisher (
    publisher_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
) STRICT;

CREATE TABLE MembershipTypes (
    membership_type_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    borrow_duration_in_days INTEGER NOT NULL CHECK (borrow_duration_in_days > 0),
    same_book_borrow_count_limit INTEGER NOT NULL DEFAULT 1 CHECK (same_book_borrow_count_limit > 0),
    max_renewal_count INTEGER NOT NULL DEFAULT 1 CHECK (max_renewal_count >= 0),
    renewal_duration_in_days INTEGER NOT NULL CHECK (renewal_duration_in_days > 0),
    overdue_fee_in_dollars REAL NOT NULL CHECK (overdue_fee_in_dollars > 0)
) STRICT;

CREATE TABLE Users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    role INTEGER NOT NULL DEFAULT 0 CHECK (role BETWEEN 0 AND 1), -- (0: user, 1: admin)
    is_a_member INTEGER NOT NULL DEFAULT 0 CHECK (is_a_member BETWEEN 0 AND 1),
    membership_last_renewed TEXT,
    membership_type_id INTEGER REFERENCES 
        MembershipTypes(membership_type_id) ON DELETE SET NULL ON UPDATE CASCADE,
    bio TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login TEXT,
    profile_image_url TEXT,
    last_seen TEXT,
    is_subbed_to_newsletter INTEGER DEFAULT 0 CHECK (is_subbed_to_newsletter BETWEEN 0 AND 1),
    theme_preference TEXT DEFAULT 'System Default' CHECK (theme_preference IN ('System Default', 'Dark', 'Light')),
    is_deleted INTEGER NOT NULL DEFAULT 0 CHECK (is_deleted BETWEEN 0 AND 1),
    deleted_at TEXT,
    CHECK (NOT (is_a_member = 1 AND membership_last_renewed IS NULL)),
    CHECK (NOT (is_a_member = 1 AND membership_type_id IS NULL))
) STRICT;

CREATE TRIGGER EnforceMembershipExpiration
AFTER UPDATE OF last_login ON Users
FOR EACH ROW
WHEN NEW.is_a_member = 1
BEGIN
    UPDATE Users 
    SET is_a_member = 0,
        membership_type_id = NULL
    WHERE user_id = NEW.user_id
      AND membership_last_renewed IS NOT NULL
      AND julianday('now') - julianday(membership_last_renewed) > 365;
END;

CREATE TABLE Credentials (
    user_id INTEGER PRIMARY KEY REFERENCES Users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    password_hash BLOB NOT NULL
) STRICT;

CREATE TABLE Authors (
    author_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    biography TEXT,
    photo_url TEXT
) STRICT;

CREATE TABLE Genres (
    genre_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL CHECK (name IN ('Fiction', 'Non-Fiction', 'Mystery', 'Fantasy', 
        'Science Fiction', 'Romance', 'Biography', 'History', 'Self-Help', 'Classic')),
    description TEXT
) STRICT;

CREATE TABLE Books (
    book_id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    isbn TEXT NOT NULL UNIQUE, -- Do NOT change to INTEGER: May contain leading zeroes
    publication_year INTEGER,
    publisher_id INTEGER REFERENCES Publisher(publisher_id) ON DELETE SET NULL ON UPDATE CASCADE,
    cover_image_url TEXT,
    page_count INTEGER CHECK (page_count > 0),
    language TEXT,
    description TEXT,
    added_date TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted INTEGER NOT NULL DEFAULT 0 CHECK (is_deleted BETWEEN 0 AND 1),
    deleted_at TEXT
) STRICT;

CREATE TABLE BookCopies (
    copy_id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER REFERENCES Books(book_id) ON DELETE CASCADE ON UPDATE CASCADE,
    format TEXT NOT NULL CHECK (format IN('Hardcover', 'Paperback')),
    is_borrowed INTEGER DEFAULT 0 CHECK (is_borrowed BETWEEN 0 AND 1),
    borrower_id INTEGER REFERENCES Users(user_id) ON DELETE SET NULL ON UPDATE CASCADE,
    in_inventory INTEGER DEFAULT 1 CHECK (in_inventory BETWEEN 0 AND 1),
    CHECK ((is_borrowed = 1 AND borrower_id IS NOT NULL) OR (is_borrowed = 0 AND borrower_id IS NULL))
) STRICT;

CREATE TABLE BookAuthor (
    book_id INTEGER REFERENCES Books(book_id) ON DELETE CASCADE ON UPDATE CASCADE,
    author_id INTEGER REFERENCES Authors(author_id) ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY (book_id, author_id)
) STRICT;

CREATE TABLE BookGenre (
    book_id INTEGER REFERENCES Books(book_id) ON DELETE CASCADE ON UPDATE CASCADE,
    genre_id INTEGER REFERENCES Genres(genre_id) ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY (book_id, genre_id)
) STRICT;

CREATE TABLE Borrowings (
    borrowing_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES Users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    copy_id INTEGER UNIQUE REFERENCES BookCopies(copy_id) ON DELETE CASCADE ON UPDATE CASCADE,
    book_id INTEGER REFERENCES Books(book_id) ON DELETE CASCADE ON UPDATE CASCADE,
    format TEXT NOT NULL CHECK (format IN ('Hardcover', 'Paperback', 'E-Book', 'Audiobook')),
    borrow_date TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    return_date TEXT,
    current_renew_count INTEGER DEFAULT 0,
    last_renewal_date TEXT,
    notes TEXT,
    CHECK (return_date IS NULL OR return_date > borrow_date),
    CHECK (
        (copy_id IS NOT NULL AND format IN ('Hardcover', 'Paperback') AND book_id IS NULL) OR
        (copy_id IS NULL AND format IN ('E-Book', 'Audiobook') AND book_id IS NOT NULL)
    )
) STRICT;

CREATE TRIGGER update_book_copy_on_borrow
AFTER INSERT ON Borrowings
FOR EACH ROW
WHEN NEW.copy_id IS NOT NULL
BEGIN
    UPDATE BookCopies
    SET is_borrowed = 1,
        borrower_id = NEW.user_id,
        in_inventory = 0
    WHERE copy_id = NEW.copy_id;
END;

CREATE TRIGGER update_book_copy_on_return
AFTER UPDATE OF return_date ON Borrowings
FOR EACH ROW
WHEN NEW.return_date IS NOT NULL AND OLD.return_date IS NULL AND NEW.copy_id IS NOT NULL
BEGIN
    UPDATE BookCopies
    SET is_borrowed = 0,
        borrower_id = NULL,
        in_inventory = 1
    WHERE copy_id = NEW.copy_id;
END;

CREATE TRIGGER prevent_duplicate_borrow
BEFORE INSERT ON Borrowings
FOR EACH ROW
BEGIN
    SELECT CASE
        WHEN EXISTS (
            SELECT 1 FROM Borrowings
            WHERE user_id = NEW.user_id
            AND (
                (NEW.copy_id IS NOT NULL AND copy_id = NEW.copy_id) OR
                (NEW.book_id IS NOT NULL AND book_id = NEW.book_id)
            )
            AND return_date IS NULL
        )
    THEN RAISE(ABORT, 'Book is already borrowed by this user')
    END;
END;

CREATE TRIGGER enforce_membership_for_borrow
BEFORE INSERT ON Borrowings
FOR EACH ROW
BEGIN
    SELECT CASE
        WHEN NOT EXISTS (
            SELECT 1 FROM Users
            WHERE user_id = NEW.user_id
            AND is_a_member = 1
            AND membership_type_id IS NOT NULL
            AND membership_last_renewed IS NOT NULL
            AND julianday('now') - julianday(membership_last_renewed) <= 365
        )
    THEN RAISE(ABORT, 'Active membership required to borrow books')
    END;
END;

CREATE TRIGGER enforce_membership_borrow_limit
BEFORE INSERT ON Borrowings
FOR EACH ROW
BEGIN
    SELECT CASE
        WHEN (
            SELECT COUNT(*)
            FROM Borrowings
            WHERE user_id = NEW.user_id AND book_id = NEW.book_id
            AND return_date IS NULL
        ) >= (
            SELECT mt.same_book_borrow_count_limit
            FROM Users u
            JOIN MembershipTypes mt ON u.membership_type_id = mt.membership_type_id
            WHERE u.user_id = NEW.user_id
        )
    THEN RAISE(ABORT, 'Maximum borrowing limit reached for your membership type')
    END;
END;

CREATE TRIGGER enforce_renewal_limits
BEFORE UPDATE OF current_renew_count ON Borrowings
FOR EACH ROW
WHEN NEW.current_renew_count > OLD.current_renew_count
BEGIN
    SELECT CASE
        WHEN NEW.current_renew_count > (
            SELECT mt.max_renewal_count
            FROM Users u
            JOIN MembershipTypes mt ON u.membership_type_id = mt.membership_type_id
            WHERE u.user_id = NEW.user_id
        )
    THEN RAISE(ABORT, 'Maximum renewal limit reached for your membership type')
    END;
END;

CREATE TRIGGER prevent_renewing_overdue
BEFORE UPDATE OF current_renew_count ON Borrowings
FOR EACH ROW
WHEN NEW.current_renew_count > OLD.current_renew_count
BEGIN
    SELECT CASE
        WHEN julianday('now') > julianday(date(NEW.borrow_date, '+' || 
            (
                SELECT mt.borrow_duration_in_days + (OLD.current_renew_count * mt.renewal_duration_in_days)
                FROM Users u
                JOIN MembershipTypes mt ON u.membership_type_id = mt.membership_type_id
                WHERE u.user_id = NEW.user_id
            ) || ' days'))
    THEN RAISE(ABORT, 'Cannot renew overdue books')
    END;
END;

CREATE TRIGGER create_due_soon_notification
    AFTER INSERT ON Borrowings
BEGIN
    INSERT INTO Notifications (
        user_id,
        notification_category_id,
        message
    )
    SELECT
        NEW.user_id,
        (SELECT notification_category_id FROM NotificationCategories WHERE name = 'Borrow reminder'),
        'Your borrowed book "' || (
            CASE
                WHEN NEW.copy_id IS NOT NULL THEN
                    (SELECT title FROM Books WHERE book_id = (SELECT book_id FROM BookCopies WHERE copy_id = NEW.copy_id))
                ELSE
                    (SELECT title FROM Books WHERE book_id = NEW.book_id)
                END
            ) || '" is due in ' || (
            SELECT borrow_duration_in_days
            FROM Users u
                     JOIN MembershipTypes mt ON u.membership_type_id = mt.membership_type_id
            WHERE u.user_id = NEW.user_id
        ) || ' days. Due on ' || date(NEW.borrow_date, '+' || (
            SELECT borrow_duration_in_days
            FROM Users u
                     JOIN MembershipTypes mt ON u.membership_type_id = mt.membership_type_id
            WHERE u.user_id = NEW.user_id
        ) || ' days')
    WHERE (
              SELECT notification_category_id FROM NotificationCategories WHERE name = 'Borrow reminder'
          ) IS NOT NULL;
END;

CREATE TABLE Favorites (
    favorite_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES Users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    book_id INTEGER REFERENCES Books(book_id) ON DELETE CASCADE ON UPDATE CASCADE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, book_id)
) STRICT;

CREATE TABLE Ratings (
    rating_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES Users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    book_id INTEGER REFERENCES Books(book_id) ON DELETE CASCADE ON UPDATE CASCADE,
    value INTEGER NOT NULL CHECK (value BETWEEN 1 AND 5),
    timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
) STRICT;

CREATE TRIGGER PreventRatingUnborrowedBook
    BEFORE INSERT ON Ratings
    FOR EACH ROW
BEGIN
    SELECT RAISE(ABORT, 'User can only rate books they have borrowed')
    WHERE NOT EXISTS (
        SELECT 1
        FROM Borrowings br
        WHERE br.user_id = NEW.user_id
          AND (
            (br.copy_id IS NOT NULL AND (SELECT book_id FROM BookCopies WHERE copy_id = br.copy_id) = NEW.book_id)
                OR
            (br.book_id = NEW.book_id AND br.format IN ('E-Book', 'Audiobook'))
            )
          AND br.return_date IS NOT NULL  -- Ensure the book was returned
    );
END;

CREATE TABLE Friendships (
    friendship_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_1_id INTEGER REFERENCES Users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    user_2_id INTEGER REFERENCES Users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    status TEXT NOT NULL DEFAULT 'Requested' CHECK (status IN('Requested', 'Accepted', 'Rejected')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (user_1_id < user_2_id)
) STRICT;

CREATE TABLE NotificationCategories (
    notification_category_id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE CHECK (name IN('Email notification',
        'Borrow reminder', 'New book alert', 'Friend activity')),
    priority INTEGER DEFAULT 0
) STRICT;

CREATE TABLE Notifications (
    notification_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES Users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    notification_category_id INTEGER NOT NULL REFERENCES 
        NotificationCategories(notification_category_id) ON DELETE CASCADE ON UPDATE CASCADE,
    message TEXT NOT NULL,
    timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_read INTEGER NOT NULL DEFAULT 0
) STRICT;

COMMIT;

-- Additional triggers for error prevention and improved user experience

-- Prevent removing books from inventory if borrowed
CREATE TRIGGER PreventRemovingBorrowedBooks
BEFORE UPDATE ON BookCopies
WHEN NEW.in_inventory = 0 AND OLD.in_inventory = 1
BEGIN
    SELECT RAISE(ABORT, 'Cannot remove borrowed book from inventory')
    WHERE OLD.is_borrowed = 1;
END;

-- Trigger to validate format availability (fixed for both physical and digital)
CREATE TRIGGER validate_format_availability
BEFORE INSERT ON Borrowings
FOR EACH ROW
BEGIN
    SELECT CASE
        WHEN NEW.format IN ('Hardcover', 'Paperback') AND NEW.copy_id IS NOT NULL AND NOT EXISTS (
            SELECT 1 FROM BookCopies
            WHERE copy_id = NEW.copy_id
            AND format = NEW.format
            AND is_borrowed = 0
            AND in_inventory = 1
        )
        THEN RAISE(ABORT, 'Requested physical format is not available')
        
        WHEN NEW.format IN ('E-Book', 'Audiobook') AND NEW.book_id IS NOT NULL AND NOT EXISTS (
            SELECT 1 FROM Books
            WHERE book_id = NEW.book_id
        )
        THEN RAISE(ABORT, 'Requested digital book does not exist')
    END;
END;


-- Trigger to notify when favorite book becomes available (revised for SQLite syntax)
CREATE TRIGGER notify_favorite_available
AFTER UPDATE OF is_borrowed ON BookCopies
WHEN NEW.is_borrowed = 0 AND OLD.is_borrowed = 1
BEGIN
    -- Notify for physical copies if this is the first available copy
    INSERT INTO Notifications (
        user_id,
        notification_category_id,
        message
    )
    SELECT 
        f.user_id,
        (SELECT notification_category_id FROM NotificationCategories WHERE name = 'New book alert'),
        'A ' || bc.format || ' copy of "' || b.title || '" is now available!'
    FROM Favorites f
    JOIN Books b ON f.book_id = b.book_id
    JOIN BookCopies bc ON bc.copy_id = NEW.copy_id
    WHERE b.book_id = (SELECT book_id FROM BookCopies WHERE copy_id = NEW.copy_id)
    -- Only notify if this is the first available copy of this format
    AND (
        SELECT COUNT(*) 
        FROM BookCopies 
        WHERE book_id = b.book_id
        AND format = bc.format
        AND is_borrowed = 0
        AND in_inventory = 1
    ) = 1
    -- Don't notify if they already have this book
    AND NOT EXISTS (
        SELECT 1 FROM Borrowings
        WHERE user_id = f.user_id
        AND (
            (copy_id IN (SELECT copy_id FROM BookCopies WHERE book_id = b.book_id)) OR
            (book_id = b.book_id)
        )
        AND return_date IS NULL
    );
END;

-- Trigger to maintain book copy inventory
CREATE TRIGGER maintain_book_inventory
AFTER UPDATE OF in_inventory ON BookCopies
FOR EACH ROW
BEGIN
    -- When a book has no copies in inventory, notify admin
    INSERT INTO Notifications (
        user_id,
        notification_category_id,
        message
    )
    SELECT 
        u.user_id,
        (SELECT notification_category_id FROM NotificationCategories WHERE name = 'Email notification'),
        'Book "' || b.title || '" has no copies available in inventory'
    FROM Users u
    JOIN Books b ON b.book_id = (SELECT book_id FROM BookCopies WHERE copy_id = NEW.copy_id)
    WHERE u.role = 1 -- Admin users only
    AND NOT EXISTS (
        SELECT 1 FROM BookCopies
        WHERE book_id = b.book_id
        AND in_inventory = 1
    );
END;

-- Trigger to prevent borrowing with overdue books
CREATE TRIGGER prevent_borrow_with_overdue
BEFORE INSERT ON Borrowings
FOR EACH ROW
BEGIN
    SELECT CASE
        WHEN EXISTS (
            SELECT 1 FROM Borrowings br
            JOIN Users u ON br.user_id = u.user_id
            JOIN MembershipTypes mt ON u.membership_type_id = mt.membership_type_id
            WHERE br.user_id = NEW.user_id
            AND br.return_date IS NULL
            AND julianday('now') > julianday(date(br.borrow_date, '+' || 
                (mt.borrow_duration_in_days + (br.current_renew_count * mt.renewal_duration_in_days)) || ' days'))
        )
    THEN RAISE(ABORT, 'Cannot borrow new books while having overdue books')
    END;
END;

-- Trigger to update last renewal date
CREATE TRIGGER update_renewal_date
AFTER UPDATE OF current_renew_count ON Borrowings
FOR EACH ROW
WHEN NEW.current_renew_count > OLD.current_renew_count
BEGIN
    UPDATE Borrowings
    SET last_renewal_date = CURRENT_TIMESTAMP
    WHERE borrowing_id = NEW.borrowing_id;
END;

-- Trigger to validate dates in Borrowings
CREATE TRIGGER validate_borrowings_dates
    BEFORE INSERT ON Borrowings
    FOR EACH ROW
BEGIN
    SELECT CASE
               -- Check that borrow_date is not in the future
               WHEN julianday(NEW.borrow_date) > julianday('now')
                   THEN RAISE(ABORT, 'Borrow date cannot be in the future')

               -- Check that return_date is not before borrow_date (if provided)
               WHEN NEW.return_date IS NOT NULL AND julianday(NEW.return_date) < julianday(NEW.borrow_date)
                   THEN RAISE(ABORT, 'Return date cannot be before borrow date')

               -- Check that renewal date is not before borrow date (if provided)
               WHEN NEW.last_renewal_date IS NOT NULL AND julianday(NEW.last_renewal_date) < julianday(NEW.borrow_date)
                   THEN RAISE(ABORT, 'Renewal date cannot be before borrow date')
               END;
END;

-- Similar trigger for updates to Borrowings
CREATE TRIGGER validate_borrowings_dates_on_update
    BEFORE UPDATE OF borrow_date, return_date, last_renewal_date ON Borrowings
    FOR EACH ROW
BEGIN
    SELECT CASE
               -- Check that borrow_date is not in the future
               WHEN NEW.borrow_date != OLD.borrow_date AND julianday(NEW.borrow_date) > julianday('now')
                   THEN RAISE(ABORT, 'Borrow date cannot be in the future')

               -- Check that return_date is not before borrow_date (if provided)
               WHEN NEW.return_date IS NOT NULL AND julianday(NEW.return_date) < julianday(NEW.borrow_date)
                   THEN RAISE(ABORT, 'Return date cannot be before borrow date')

               -- Check that renewal date is not before borrow date (if provided)
               WHEN NEW.last_renewal_date IS NOT NULL AND julianday(NEW.last_renewal_date) < julianday(NEW.borrow_date)
                   THEN RAISE(ABORT, 'Renewal date cannot be before borrow date')
               END;
END;

-- Trigger to notify users of membership expiration
CREATE TRIGGER notify_membership_expiration
AFTER UPDATE OF last_login ON Users
FOR EACH ROW
WHEN NEW.is_a_member = 1 
  AND NEW.membership_last_renewed IS NOT NULL
  AND julianday(NEW.membership_last_renewed) + 365 - julianday('now') BETWEEN 0 AND 30
BEGIN
    -- Find notification category with safer fallback
    INSERT INTO Notifications (
        user_id,
        notification_category_id,
        message
    )
    VALUES (
        NEW.user_id,
        COALESCE(
            (SELECT notification_category_id FROM NotificationCategories WHERE name = 'Email notification' LIMIT 1),
            (SELECT MIN(notification_category_id) FROM NotificationCategories)
        ),
        'Your membership will expire in ' || CAST(ROUND(julianday(NEW.membership_last_renewed) + 365 - julianday('now')) AS INTEGER) || ' days. Please renew to maintain borrowing privileges.'
    );
END;

-- Additional trigger to catch membership renewals
CREATE TRIGGER notify_membership_expiration_on_renewal
AFTER UPDATE OF membership_last_renewed ON Users
FOR EACH ROW
WHEN NEW.is_a_member = 1 
  AND NEW.membership_last_renewed IS NOT NULL
  AND julianday(NEW.membership_last_renewed) + 365 - julianday('now') BETWEEN 0 AND 30
BEGIN
    -- Find notification category with safer fallback
    INSERT INTO Notifications (
        user_id,
        notification_category_id,
        message
    )
    VALUES (
        NEW.user_id,
        COALESCE(
            (SELECT notification_category_id FROM NotificationCategories WHERE name = 'Email notification' LIMIT 1),
            (SELECT MIN(notification_category_id) FROM NotificationCategories)
        ),
        'Your membership will expire in ' || CAST(ROUND(julianday(NEW.membership_last_renewed) + 365 - julianday('now')) AS INTEGER) || ' days. Please renew to maintain borrowing privileges.'
    );
END;


