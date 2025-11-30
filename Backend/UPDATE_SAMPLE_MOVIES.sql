-- ============================================
-- Update Sample Movies with Directors and Proper Ratings
-- ============================================

USE revticket_db;

-- Update existing movies with directors and decimal ratings
UPDATE movies SET director = 'Aditya Chopra', rating = 8.1 WHERE title = 'Dilwale Dulhania Le Jayenge';
UPDATE movies SET director = 'Anthony Russo, Joe Russo', rating = 8.4 WHERE title = 'Avengers: Endgame';
UPDATE movies SET director = 'Chad Stahelski', rating = 7.8 WHERE title = 'John Wick: Chapter 4';
UPDATE movies SET director = 'Ruben Fleischer', rating = 6.7 WHERE title = 'Venom';
UPDATE movies SET director = 'Christopher McQuarrie', rating = 7.9 WHERE title LIKE 'Mission: Impossible%';
UPDATE movies SET director = 'Dean DeBlois', rating = 7.4 WHERE title = 'How to Train Your Dragon';

-- Add some crew members for existing movies
INSERT IGNORE INTO movie_crew (movie_id, crew_member) 
SELECT id, 'Kevin Feige' FROM movies WHERE title = 'Avengers: Endgame';

INSERT IGNORE INTO movie_crew (movie_id, crew_member) 
SELECT id, 'Basil Iwanyk' FROM movies WHERE title = 'John Wick: Chapter 4';

INSERT IGNORE INTO movie_crew (movie_id, crew_member) 
SELECT id, 'Avi Arad' FROM movies WHERE title = 'Venom';

-- Verify updates
SELECT 'Updated movie data:' AS info;
SELECT id, title, rating, director, is_active 
FROM movies 
ORDER BY title;

SELECT 'Movie crew data:' AS info;
SELECT m.title, mc.crew_member 
FROM movies m
LEFT JOIN movie_crew mc ON m.id = mc.movie_id
ORDER BY m.title;
