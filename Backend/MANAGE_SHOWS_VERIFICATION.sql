-- ============================================
-- Manage Shows - Database Verification Script
-- ============================================
-- This script verifies that the database schema
-- supports all Manage Shows functionality
-- ============================================

USE revticket_db;

-- Verify showtimes table structure
DESCRIBE showtimes;

-- Check if all required columns exist
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_KEY,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'revticket_db'
  AND TABLE_NAME = 'showtimes'
ORDER BY ORDINAL_POSITION;

-- Verify indexes for optimal query performance
SHOW INDEX FROM showtimes;

-- Check foreign key constraints
SELECT 
    CONSTRAINT_NAME,
    TABLE_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'revticket_db'
  AND TABLE_NAME = 'showtimes'
  AND REFERENCED_TABLE_NAME IS NOT NULL;

-- Verify status enum values
SELECT COLUMN_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'revticket_db'
  AND TABLE_NAME = 'showtimes'
  AND COLUMN_NAME = 'status';

-- Sample query to test filtering (as used by backend)
-- Filter by movie
SELECT s.id, s.show_date_time, m.title, t.name, s.status
FROM showtimes s
JOIN movies m ON s.movie_id = m.id
JOIN theaters t ON s.theater_id = t.id
WHERE s.movie_id = (SELECT id FROM movies LIMIT 1)
ORDER BY s.show_date_time ASC;

-- Filter by theater
SELECT s.id, s.show_date_time, m.title, t.name, s.status
FROM showtimes s
JOIN movies m ON s.movie_id = m.id
JOIN theaters t ON s.theater_id = t.id
WHERE s.theater_id = (SELECT id FROM theaters LIMIT 1)
ORDER BY s.show_date_time ASC;

-- Filter by date
SELECT s.id, s.show_date_time, m.title, t.name, s.status
FROM showtimes s
JOIN movies m ON s.movie_id = m.id
JOIN theaters t ON s.theater_id = t.id
WHERE DATE(s.show_date_time) = CURDATE()
ORDER BY s.show_date_time ASC;

-- Search by movie or theater name
SELECT s.id, s.show_date_time, m.title, t.name, s.status
FROM showtimes s
JOIN movies m ON s.movie_id = m.id
JOIN theaters t ON s.theater_id = t.id
WHERE LOWER(m.title) LIKE '%action%'
   OR LOWER(t.name) LIKE '%pvr%'
ORDER BY s.show_date_time ASC;

-- Count shows by status
SELECT status, COUNT(*) as count
FROM showtimes
GROUP BY status;

-- Check for any shows without proper relationships
SELECT 
    s.id,
    s.movie_id,
    s.theater_id,
    CASE WHEN m.id IS NULL THEN 'Missing Movie' ELSE 'OK' END as movie_check,
    CASE WHEN t.id IS NULL THEN 'Missing Theater' ELSE 'OK' END as theater_check
FROM showtimes s
LEFT JOIN movies m ON s.movie_id = m.id
LEFT JOIN theaters t ON s.theater_id = t.id
WHERE m.id IS NULL OR t.id IS NULL;

-- ============================================
-- RESULT INTERPRETATION:
-- ============================================
-- 1. showtimes table should have these columns:
--    - id (VARCHAR(36), PRIMARY KEY)
--    - movie_id (VARCHAR(36), NOT NULL)
--    - theater_id (VARCHAR(36), NOT NULL)
--    - screen (VARCHAR(50), NOT NULL)
--    - show_date_time (DATETIME, NOT NULL)
--    - ticket_price (DOUBLE, NOT NULL)
--    - total_seats (INT, NOT NULL)
--    - available_seats (INT, NOT NULL)
--    - status (ENUM('ACTIVE','COMPLETED','CANCELLED'))
--
-- 2. Required indexes should exist:
--    - PRIMARY KEY on id
--    - INDEX on movie_id
--    - INDEX on theater_id
--    - INDEX on show_date_time
--    - INDEX on status
--
-- 3. Foreign keys should exist:
--    - movie_id -> movies(id)
--    - theater_id -> theaters(id)
--
-- 4. Status enum should have values:
--    - ACTIVE
--    - COMPLETED
--    - CANCELLED
--
-- If all checks pass, the database is ready for
-- the Manage Shows functionality.
-- ============================================

SELECT 'Database verification completed!' as message;
