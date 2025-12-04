# Seat Booking Architecture - RevTicket

## Current Implementation (CORRECT)

### Database Design
The seat booking system is **already correctly implemented** with seats tied to specific showtimes:

```
Seat Entity:
- id (PK)
- showtime_id (FK) → Links to specific showtime
- row
- number
- is_booked
- is_held
- price
- type
- hold_expiry
- session_id
```

### How It Works

1. **Seat Initialization Per Showtime**
   - When `SeatService.getSeatsByShowtime(showtimeId)` is called
   - If no seats exist for that showtime, `initializeSeatsForShowtime()` creates them
   - Each showtime gets its own independent set of seats

2. **Booking Flow**
   - User selects movie → theater → showtime (specific date/time)
   - Frontend calls `/api/seats/showtime/{showtimeId}` 
   - Backend returns seats for THAT specific showtime only
   - When booking, seats are marked as booked for that showtime

3. **Seat Isolation**
   - Movie "Avatar" at Theater A, Screen 1, 2:00 PM → Has its own seat set
   - Movie "Avatar" at Theater A, Screen 1, 5:00 PM → Has its own seat set
   - Movie "Avatar" at Theater A, Screen 1, 2:00 PM (next day) → Has its own seat set

## Verification

### Check if seats are properly isolated:

```sql
-- Check seats for different showtimes of same movie
SELECT 
    s.showtime_id,
    st.show_date_time,
    COUNT(*) as total_seats,
    SUM(CASE WHEN s.is_booked = true THEN 1 ELSE 0 END) as booked_seats
FROM seats s
JOIN showtimes st ON s.showtime_id = st.id
WHERE st.movie_id = 'SOME_MOVIE_ID'
GROUP BY s.showtime_id, st.show_date_time
ORDER BY st.show_date_time;
```

## Potential Issues

If seats appear occupied across all showtimes, possible causes:

1. **Frontend Issue**: Not passing correct `showtimeId` to seat selection API
2. **Seat Initialization**: Seats not being created per showtime
3. **Data Corruption**: Old bookings referencing wrong seats
4. **Caching**: Frontend caching seat data incorrectly

## Solution Steps

1. **Verify Frontend Calls**
   - Check that seat selection page uses correct `showtimeId` from route params
   - Ensure API calls include the specific showtime ID

2. **Clear Existing Data** (if needed)
   ```sql
   -- Backup first!
   DELETE FROM seats WHERE showtime_id IN (SELECT id FROM showtimes WHERE show_date_time < NOW());
   ```

3. **Test Flow**
   - Create 2 showtimes for same movie, different times
   - Book seats in first showtime
   - Verify second showtime shows all seats available

## Code References

- **Seat Entity**: `Backend/src/main/java/com/revticket/entity/Seat.java`
- **Seat Service**: `Backend/src/main/java/com/revticket/service/SeatService.java`
- **Booking Service**: `Backend/src/main/java/com/revticket/service/BookingService.java`
- **Seat Repository**: `Backend/src/main/java/com/revticket/repository/SeatRepository.java`

## Conclusion

The backend architecture is **CORRECT**. Seats are properly isolated per showtime. If you're experiencing issues where seats appear occupied across all showtimes, the problem is likely:
- Frontend not using correct showtime IDs
- Database has corrupted/test data
- Seats weren't initialized properly for each showtime

**Next Step**: Check the frontend seat selection component to ensure it's passing the correct `showtimeId` parameter.
