-- ============================================
-- Movie Schema Fix and Migration
-- Ensures all required columns exist with correct types
-- ============================================

USE revticket_db;

-- Check and add director column if missing
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'revticket_db' 
  AND TABLE_NAME = 'movies' 
  AND COLUMN_NAME = 'director';

SET @query = IF(@col_exists = 0,
    'ALTER TABLE movies ADD COLUMN director VARCHAR(255) NULL AFTER rating',
    'SELECT "director column already exists" AS info');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ensure rating is DOUBLE type (should already be, but verify)
ALTER TABLE movies MODIFY COLUMN rating DOUBLE NULL;

-- Ensure is_active has proper default
ALTER TABLE movies MODIFY COLUMN is_active TINYINT(1) DEFAULT 1;

-- Verify movie_genres table exists
CREATE TABLE IF NOT EXISTS movie_genres (
    movie_id VARCHAR(36) NOT NULL,
    genre VARCHAR(100) NOT NULL,
    PRIMARY KEY (movie_id, genre),
    FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Verify movie_crew table exists
CREATE TABLE IF NOT EXISTS movie_crew (
    movie_id VARCHAR(36) NOT NULL,
    crew_member VARCHAR(255) NOT NULL,
    PRIMARY KEY (movie_id, crew_member),
    FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Display current schema
SELECT 'Movies table schema:' AS info;
DESCRIBE movies;

SELECT 'Movie genres table schema:' AS info;
DESCRIBE movie_genres;

SELECT 'Movie crew table schema:' AS info;
DESCRIBE movie_crew;

-- Display sample data
SELECT 'Sample movie data:' AS info;
SELECT id, title, rating, director, is_active 
FROM movies 
LIMIT 5;
