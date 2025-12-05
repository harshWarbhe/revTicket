package com.revticket.repository;

import com.revticket.entity.MongoReview;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MongoReviewRepository extends MongoRepository<MongoReview, String> {
    List<MongoReview> findByMovieIdAndApprovedTrueOrderByCreatedAtDesc(String movieId);
    List<MongoReview> findByMovieIdOrderByCreatedAtDesc(String movieId);
    Optional<MongoReview> findByUserIdAndMovieId(String userId, String movieId);
    List<MongoReview> findByApprovedFalseOrderByCreatedAtDesc();
    
    @Query(value = "{ 'movieId': ?0, 'approved': true }", count = true)
    long countApprovedByMovieId(String movieId);
}
