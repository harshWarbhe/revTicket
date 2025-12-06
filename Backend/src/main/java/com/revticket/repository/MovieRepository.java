package com.revticket.repository;

import com.revticket.entity.Movie;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MovieRepository extends JpaRepository<Movie, String> {
    List<Movie> findByIsActiveTrue();
    
    @Query("SELECT DISTINCT m FROM Movie m LEFT JOIN m.showtimes s LEFT JOIN s.theater t WHERE m.isActive = true AND (LOWER(t.location) = LOWER(:city) OR t.location IS NULL) AND (t.isActive = true OR t.isActive IS NULL)")
    List<Movie> findActiveMoviesByCity(String city);
    
    @Query("SELECT COUNT(s) FROM Showtime s WHERE s.movie.id = :movieId")
    Integer countShowtimesByMovieId(String movieId);
    
    @Query("SELECT COUNT(b) FROM Booking b WHERE b.showtime.movie.id = :movieId")
    Integer countBookingsByMovieId(String movieId);
}

