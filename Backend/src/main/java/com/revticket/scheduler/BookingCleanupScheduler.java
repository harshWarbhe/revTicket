package com.revticket.scheduler;

import com.revticket.entity.Booking;
import com.revticket.repository.BookingRepository;
import com.revticket.repository.SeatRepository;
import com.revticket.repository.ShowtimeRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class BookingCleanupScheduler {

    private static final Logger logger = LoggerFactory.getLogger(BookingCleanupScheduler.class);

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private SeatRepository seatRepository;

    @Autowired
    private ShowtimeRepository showtimeRepository;

    // Run every day at 2 AM
    @Scheduled(cron = "0 0 2 * * ?")
    @Transactional
    public void cleanupOldBookings() {
        logger.info("Starting cleanup of old bookings...");

        try {
            LocalDateTime cutoffDate = LocalDateTime.now().minusDays(7);
            
            List<Booking> oldBookings = bookingRepository.findAll().stream()
                .filter(b -> b.getShowtime().getShowDateTime().isBefore(cutoffDate))
                .toList();

            if (oldBookings.isEmpty()) {
                logger.info("No old bookings to cleanup");
                return;
            }

            int deletedCount = 0;
            for (Booking booking : oldBookings) {
                try {
                    seatRepository.deleteByShowtimeId(booking.getShowtime().getId());
                    bookingRepository.delete(booking);
                    deletedCount++;
                } catch (Exception e) {
                    logger.error("Failed to delete booking: " + booking.getId(), e);
                }
            }

            logger.info("Cleanup completed. Deleted {} old bookings", deletedCount);
        } catch (Exception e) {
            logger.error("Error during booking cleanup", e);
        }
    }

    // Run every day at 3 AM
    @Scheduled(cron = "0 0 3 * * ?")
    @Transactional
    public void cleanupOldShowtimes() {
        logger.info("Starting cleanup of old showtimes...");

        try {
            LocalDateTime cutoffDate = LocalDateTime.now().minusDays(7);
            
            List<com.revticket.entity.Showtime> oldShowtimes = showtimeRepository.findAll().stream()
                .filter(st -> st.getShowDateTime().isBefore(cutoffDate))
                .toList();

            if (oldShowtimes.isEmpty()) {
                logger.info("No old showtimes to cleanup");
                return;
            }

            int deletedCount = 0;
            for (com.revticket.entity.Showtime showtime : oldShowtimes) {
                try {
                    List<Booking> bookings = bookingRepository.findByShowtimeId(showtime.getId());
                    if (bookings.isEmpty()) {
                        seatRepository.deleteByShowtimeId(showtime.getId());
                        showtimeRepository.delete(showtime);
                        deletedCount++;
                    }
                } catch (Exception e) {
                    logger.error("Failed to delete showtime: " + showtime.getId(), e);
                }
            }

            logger.info("Cleanup completed. Deleted {} old showtimes", deletedCount);
        } catch (Exception e) {
            logger.error("Error during showtime cleanup", e);
        }
    }
}
