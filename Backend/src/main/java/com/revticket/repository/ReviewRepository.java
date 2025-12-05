package com.revticket.repository;

import com.revticket.entity.Review;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends MongoRepository<Review, String> {
    List<Review> findByMovieIdOrderByCreatedAtDesc(String movieId);
    Optional<Review> findByMovieIdAndUserId(String movieId, String userId);
    Double findAverageRatingByMovieId(String movieId);
    Long countByMovieId(String movieId);
    List<Review> findByUserIdOrderByCreatedAtDesc(String userId);
}