package com.revticket.repository;

import com.revticket.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, String> {
    List<Review> findByMovieIdOrderByCreatedAtDesc(String movieId);
    Optional<Review> findByUserIdAndMovieId(String userId, String movieId);
    
    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.movie.id = :movieId")
    Double getAverageRatingByMovieId(String movieId);
}