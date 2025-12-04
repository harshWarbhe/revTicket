-- Verify Seat Isolation Per Showtime
-- This script checks if seats are properly isolated for each showtime

-- 1. Check total seats per showtime
SELECT 
    st.id as showtime_id,
    m.title as movie,
    t.name as theater,
    sc.name as screen,
    st.show_date_time,
    COUNT(s.id) as total_seats_in_db,
    st.total_seats as total_seats_config,
    SUM(CASE WHEN s.is_booked = true THEN 1 ELSE 0 END) as booked_seats,
    st.available_seats as available_seats_config
FROM showtimes st
LEFT JOIN movies m ON st.movie_id = m.id
LEFT JOIN theaters t ON st.theater_id = t.id
LEFT JOIN screens sc ON st.screen = sc.id
LEFT JOIN seats s ON s.showtime_id = st.id
GROUP BY st.id, m.title, t.name, sc.name, st.show_date_time, st.total_seats, st.available_seats
ORDER BY m.title, st.show_date_time;

-- 2. Check if same movie at different times has independent seats
SELECT 
    m.title as movie,
    st.show_date_time,
    COUNT(DISTINCT s.id) as unique_seat_records,
    SUM(CASE WHEN s.is_booked = true THEN 1 ELSE 0 END) as booked_count
FROM showtimes st
JOIN movies m ON st.movie_id = m.id
LEFT JOIN seats s ON s.showtime_id = st.id
GROUP BY m.title, st.show_date_time
ORDER BY m.title, st.show_date_time;

-- 3. Check for any seats not linked to a showtime (should be 0)
SELECT COUNT(*) as orphaned_seats
FROM seats s
WHERE s.showtime_id IS NULL OR s.showtime_id NOT IN (SELECT id FROM showtimes);

-- 4. Check bookings and their seat associations
SELECT 
    b.id as booking_id,
    b.ticket_number,
    m.title as movie,
    st.show_date_time,
    b.seats as seat_ids,
    b.seat_labels,
    b.status
FROM bookings b
JOIN showtimes st ON b.showtime_id = st.id
JOIN movies m ON st.movie_id = m.id
ORDER BY st.show_date_time DESC
LIMIT 20;

-- 5. Verify seat IDs in bookings match showtime
-- This checks if any booking has seats from wrong showtime
SELECT 
    b.id as booking_id,
    b.ticket_number,
    st.id as booking_showtime_id,
    s.showtime_id as seat_showtime_id,
    CASE 
        WHEN st.id = s.showtime_id THEN 'CORRECT'
        ELSE 'MISMATCH'
    END as validation
FROM bookings b
JOIN showtimes st ON b.showtime_id = st.id
CROSS JOIN LATERAL unnest(b.seats) AS seat_id
LEFT JOIN seats s ON s.id = seat_id
WHERE b.status = 'CONFIRMED'
ORDER BY b.booking_date DESC;
