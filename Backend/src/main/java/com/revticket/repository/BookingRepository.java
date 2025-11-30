package com.revticket.repository;

import com.revticket.entity.Booking;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, String> {
    
    @EntityGraph(attributePaths = {"showtime", "showtime.movie", "showtime.theater", "user"})
    List<Booking> findByUserId(String userId);
    
    @EntityGraph(attributePaths = {"showtime", "showtime.movie", "showtime.theater", "user"})
    List<Booking> findByShowtimeId(String showtimeId);
    
    @EntityGraph(attributePaths = {"showtime", "showtime.movie", "showtime.theater", "user"})
    @Query("SELECT b FROM Booking b")
    @NonNull
    List<Booking> findAll();
    
    @EntityGraph(attributePaths = {"showtime", "showtime.movie", "showtime.theater", "user"})
    @NonNull
    Optional<Booking> findById(@NonNull String id);

    @Query("SELECT COUNT(b) FROM Booking b WHERE b.bookingDate BETWEEN :start AND :end")
    Long countByDateRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COALESCE(SUM(b.totalAmount), 0.0) FROM Booking b WHERE b.status = 'CONFIRMED' AND b.bookingDate BETWEEN :start AND :end")
    Double sumRevenueByDateRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(b) FROM Booking b WHERE b.status = 'CANCELLED' AND b.bookingDate BETWEEN :start AND :end")
    Long countCancelledByDateRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COALESCE(SUM(b.refundAmount), 0.0) FROM Booking b WHERE b.status = 'CANCELLED' AND b.bookingDate BETWEEN :start AND :end")
    Double sumRefundsByDateRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @EntityGraph(attributePaths = {"showtime", "showtime.movie", "showtime.theater", "user"})
    @Query("SELECT b FROM Booking b WHERE " +
           "(:fromDate IS NULL OR b.bookingDate >= :fromDate) AND " +
           "(:toDate IS NULL OR b.bookingDate <= :toDate) AND " +
           "(:theaterId IS NULL OR b.showtime.theater.id = :theaterId) AND " +
           "(:movieId IS NULL OR b.showtime.movie.id = :movieId) AND " +
           "(:status IS NULL OR b.status = :status) AND " +
           "(:search IS NULL OR LOWER(b.customerName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(b.customerEmail) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(b.id) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Booking> findByFilters(
        @Param("fromDate") LocalDateTime fromDate,
        @Param("toDate") LocalDateTime toDate,
        @Param("theaterId") String theaterId,
        @Param("movieId") String movieId,
        @Param("status") Booking.BookingStatus status,
        @Param("search") String search,
        Pageable pageable
    );
}

