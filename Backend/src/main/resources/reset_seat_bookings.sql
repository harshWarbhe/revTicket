-- Reset Seat Bookings Script
-- This script clears all bookings and resets seats to available state
-- USE WITH CAUTION: This will delete all booking data!

-- Step 1: Backup current data (optional - uncomment to create backup)
-- CREATE TABLE bookings_backup AS SELECT * FROM bookings;
-- CREATE TABLE seats_backup AS SELECT * FROM seats;

-- Step 2: Delete all bookings
DELETE FROM bookings;

-- Step 3: Reset all seats to available
UPDATE seats 
SET is_booked = false, 
    is_held = false, 
    hold_expiry = NULL, 
    session_id = NULL;

-- Step 4: Reset available seats count in showtimes
UPDATE showtimes st
SET available_seats = (
    SELECT COUNT(*) 
    FROM seats s 
    WHERE s.showtime_id = st.id
);

-- Step 5: Verify the reset
SELECT 
    st.id as showtime_id,
    m.title as movie,
    t.name as theater,
    st.show_date_time,
    st.total_seats,
    st.available_seats,
    COUNT(s.id) as seat_count,
    SUM(CASE WHEN s.is_booked = true THEN 1 ELSE 0 END) as booked_count
FROM showtimes st
LEFT JOIN movies m ON st.movie_id = m.id
LEFT JOIN theaters t ON st.theater_id = t.id
LEFT JOIN seats s ON s.showtime_id = st.id
GROUP BY st.id, m.title, t.name, st.show_date_time, st.total_seats, st.available_seats
ORDER BY st.show_date_time;

-- Expected result: booked_count should be 0 for all showtimes
