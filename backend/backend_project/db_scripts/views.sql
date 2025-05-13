CREATE TABLE GlobalParameters
(
    user_id INTEGER
);

CREATE VIEW UserNotifications AS
SELECT CASE nc.name
           WHEN 'Email notification' THEN 'Email: '
           WHEN 'Borrow reminder' THEN 'Reminder: '
           WHEN 'New book alert' THEN 'New Book: '
           WHEN 'Friend activity' THEN 'Your Friend '
           END || n.message
FROM Notifications n
         JOIN NotificationCategories nc ON n.notification_category_id = nc.notification_category_id
WHERE user_id = (SELECT user_id FROM GlobalParameters);

CREATE VIEW UserFriends AS
SELECT first_name || ' ' || last_name,
       profile_image_url
FROM Users
WHERE user_id = (SELECT user_id FROM GlobalParameters);

CREATE VIEW UserFavorites AS
SELECT
    b.title AS title,
    (
        SELECT GROUP_CONCAT(a.name, ', ')
        FROM BookAuthor ba
            JOIN Authors a USING(author_id)
        WHERE ba.book_id = f.book_id
    ) AS author,
    (
        SELECT GROUP_CONCAT(g.name, ', ')
        FROM BookGenre bg
            JOIN Genres g USING(genre_id)
        WHERE bg.book_id = f.book_id
    ) AS genre
FROM
    Favorites f
    JOIN Books b ON f.book_id = b.book_id
WHERE
    f.user_id = (SELECT user_id FROM GlobalParameters);

CREATE VIEW UserDashboardBorrows AS
SELECT
    b.title AS title,
    (
        SELECT GROUP_CONCAT(a.name, ', ')
        FROM BookAuthor ba
            JOIN Authors a USING(author_id)
        WHERE ba.book_id = b.book_id
    ) AS author,
    (
        SELECT GROUP_CONCAT(g.name, ', ')
        FROM BookGenre bg
            JOIN Genres g USING(genre_id)
        WHERE bg.book_id = b.book_id
    ) AS genre
FROM
    Borrowings br
    JOIN BookCopies bc USING(copy_id)
    JOIN Books b USING (book_id)
WHERE bc.is_borrowed = 1
  AND br.user_id = (SELECT user_id FROM GlobalParameters);

CREATE VIEW UserProfile AS
SELECT
    username,
    email,
    first_name || ' ' || last_name AS full_name,
    bio,
    CASE role
        WHEN 1 THEN 'Admin'
        ELSE 'User'
        END AS account_type,
    CASE is_a_member
        WHEN 1 THEN 'Active member'
        ELSE 'Not a member'
        END AS membership_status,
    theme_preference,
    (
        CASE CAST(strftime('%m', created_at) AS TEXT)
            WHEN '01' THEN 'January'
            WHEN '02' THEN 'February'
            WHEN '03' THEN 'March'
            WHEN '04' THEN 'April'
            WHEN '05' THEN 'May'
            WHEN '06' THEN 'June'
            WHEN '07' THEN 'July'
            WHEN '08' THEN 'August'
            WHEN '09' THEN 'September'
            WHEN '10' THEN 'October'
            WHEN '11' THEN 'November'
            ELSE 'December'
            END || ' ' || strftime('%Y', created_at)
        ) AS member_since,
    profile_image_url,
    CASE is_subbed_to_newsletter
        WHEN 1 THEN 'Subscribed'
        ELSE 'Not subscribed'
        END AS newsletter_subscription,
    (
        SELECT COUNT(DISTINCT bc.book_id)
        FROM Borrowings br
                 JOIN BookCopies bc USING(copy_id)
        WHERE br.user_id = Users.user_id
    ) AS books_borrowed,
    (
        SELECT COUNT(*)
        FROM Favorites
        WHERE user_id = Users.user_id
    ) AS books_favorited
FROM Users
WHERE user_id = (SELECT user_id FROM GlobalParameters);

CREATE VIEW BookList AS
SELECT
    b.book_id,
    b.title,
    b.isbn,
    b.publication_year,
    p.name AS publisher,
    b.cover_image_url,
    b.page_count,
    b.language,
    b.description,
    b.added_date,
    COALESCE(
        (SELECT ROUND(AVG(value), 1)
        FROM Ratings
        WHERE book_id = b.book_id
        ), -1 -- -1 -> (N/A)
    ) AS average_rating,
    (
        SELECT GROUP_CONCAT(DISTINCT a.name, ', ')
        FROM BookAuthor ba
            JOIN Authors a USING (author_id)
        WHERE ba.book_id = b.book_id
    ) AS authors,
    (
        SELECT GROUP_CONCAT(DISTINCT g.name, ', ')
        FROM BookGenre bg
            JOIN Genres g USING (genre_id)
        WHERE bg.book_id = b.book_id
    ) AS genres,
    (
        SELECT COUNT(*)
        FROM BookCopies bc
        WHERE bc.book_id = b.book_id
          AND bc.in_inventory = 1
          AND bc.is_borrowed = 0
    ) AS available_copies,
    CASE
        WHEN (SELECT COUNT(*) FROM BookCopies bc
        WHERE bc.book_id = b.book_id
          AND bc.in_inventory = 1
          AND bc.is_borrowed = 0) <= 0 THEN 'unavailable'
        WHEN (SELECT COUNT(*) FROM BookCopies bc
        WHERE bc.book_id = b.book_id
          AND bc.in_inventory = 1
          AND bc.is_borrowed = 0) <= 10 THEN 'low stock'
        ELSE 'available'
        END AS availability,
    (
        SELECT GROUP_CONCAT(DISTINCT bc.format, ', ')
        FROM BookCopies bc
        WHERE bc.book_id = b.book_id
          AND bc.in_inventory = 1
    ) AS available_formats
FROM Books b
         LEFT JOIN Publisher p USING (publisher_id);

CREATE VIEW AdminBookDashboard AS
SELECT
    b.book_id,
    b.title,
    b.isbn,
    b.publication_year,
    p.name AS publisher,
    b.cover_image_url,
    b.page_count,
    b.language,
    b.description,
    b.added_date,
    COALESCE(ROUND(AVG(r.value), 1), 0.0) AS average_rating,
    GROUP_CONCAT(DISTINCT a.name, ', ') AS authors,
    GROUP_CONCAT(DISTINCT g.name, ', ') AS genres,
    COUNT(DISTINCT br.borrowing_id) AS total_borrows,
    GROUP_CONCAT(DISTINCT CASE WHEN br.return_date IS NULL THEN br.user_id ELSE NULL END) AS active_borrowers,
    COUNT(CASE WHEN bc.is_borrowed = 0 AND bc.format IN ('Hardcover', 'Paperback') THEN 1 END) AS available_copies,
    CASE
        WHEN COUNT(CASE WHEN bc.is_borrowed = 0 AND bc.format IN ('Hardcover', 'Paperback') THEN 1 END) = 0 THEN 'unavailable'
        WHEN COUNT(CASE WHEN bc.is_borrowed = 0 AND bc.format IN ('Hardcover', 'Paperback') THEN 1 END) <= 10 THEN 'low stock'
        ELSE 'available'
        END AS availability_status,
    GROUP_CONCAT(DISTINCT bc.format, ', ') AS available_formats
FROM Books b
         LEFT JOIN Publisher p USING (publisher_id)
         LEFT JOIN Ratings r USING (book_id)
         LEFT JOIN BookAuthor ba USING (book_id)
         LEFT JOIN Authors a USING (author_id)
         LEFT JOIN BookGenre bg USING (book_id)
         LEFT JOIN Genres g USING (genre_id)
         LEFT JOIN BookCopies bc USING (book_id)
         LEFT JOIN Borrowings br ON bc.copy_id = br.copy_id
GROUP BY b.book_id;


CREATE VIEW BookBorrowers AS
SELECT
    u.user_id,
    u.username,
    u.first_name,
    u.last_name,
    br.borrow_date,
    br.return_date,
    br.format
FROM
    Borrowings br
JOIN
    Users u ON br.user_id = u.user_id


CREATE VIEW BorrowHistory AS
SELECT
    b.title,
    bc.format,
    br.borrow_date,
    br.return_date,
    br.current_renew_count AS total_renewals,
    br.last_renewal_date,
    date(br.borrow_date, '+' || mt.borrow_duration_in_days || ' days') AS original_due_date,
    MAX(0, (julianday(br.return_date) - julianday(date(br.borrow_date, '+' || mt.borrow_duration_in_days || ' days'))))        * mt.overdue_fee_in_dollars AS late_fee_paid
FROM Borrowings br
         JOIN BookCopies bc USING (copy_id)
         JOIN Books b USING (book_id)
         JOIN Users u USING (user_id)
         JOIN MembershipTypes mt USING (membership_type_id)
WHERE br.return_date IS NOT NULL
  AND u.user_id = (SELECT user_id FROM GlobalParameters);

CREATE VIEW BorrowersList AS
WITH borrow_details AS (
    SELECT
        u.username,
        u.profile_image_url,
        b.title AS book_title,
        br.borrow_date,
        mt.borrow_duration_in_days,
        mt.renewal_duration_in_days,
        br.current_renew_count,
        mt.max_renewal_count,
        mt.overdue_fee_in_dollars,
        bc.format,
        date(br.borrow_date, '+' || (mt.borrow_duration_in_days +
            (br.current_renew_count * mt.renewal_duration_in_days)) || ' days'
        ) AS current_due_date,
        julianday('now') AS today_jd,
        julianday(date(br.borrow_date, '+' || (mt.borrow_duration_in_days +
            (br.current_renew_count * mt.renewal_duration_in_days)) || ' days' )
        ) AS due_date_jd
    FROM Borrowings br
        JOIN BookCopies bc USING (copy_id)
        JOIN Books b USING (book_id)
        JOIN Users u USING (user_id)
        JOIN MembershipTypes mt USING (membership_type_id)
    WHERE bc.is_borrowed = 1
)
SELECT
    username,
    profile_image_url,
    book_title,
    borrow_date,
    current_due_date,
    CASE
        WHEN today_jd > due_date_jd THEN 'Overdue'
        WHEN (due_date_jd - today_jd) <= 7 THEN
            'Due in ' || CAST(ROUND(due_date_jd - today_jd) AS INTEGER) || ' days'
        ELSE 'Not due soon'
        END AS status,
    format,
    current_renew_count AS renewals_used,
    max_renewal_count - current_renew_count AS renewals_remaining,
    overdue_fee_in_dollars AS daily_late_fee,
    CASE WHEN today_jd > due_date_jd
             THEN ROUND((today_jd - due_date_jd) * overdue_fee_in_dollars, 2)
         ELSE 0.0
        END AS current_late_fee
FROM borrow_details
ORDER BY due_date_jd;