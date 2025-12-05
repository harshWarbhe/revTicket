package com.revticket.service;

import com.revticket.repository.BookingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class UserBookingService {

    @Autowired
    private BookingRepository bookingRepository;

    public boolean hasUserWatchedMovie(String userId, String movieId) {
        // Check if user has completed bookings for this movie (showtime in the past)
        return bookingRepository.existsByUserIdAndShowtimeMovieIdAndShowtimeShowDateTimeBefore(
            userId, movieId, LocalDateTime.now()
        );
    }
}