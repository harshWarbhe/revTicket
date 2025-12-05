package com.revticket.service;

import com.revticket.dto.ReviewDTO;
import com.revticket.dto.ReviewRequest;
import com.revticket.entity.Review;
import com.revticket.repository.ReviewRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ReviewService {

    @Autowired
    private ReviewRepository reviewRepository;
    
    @Autowired
    private MongoTemplate mongoTemplate;

    public ReviewDTO addReview(String userId, String userName, ReviewRequest request) {
        try {
            // Check if user already reviewed this movie
            Optional<Review> existingReview = reviewRepository.findByMovieIdAndUserId(request.getMovieId(), userId);
            
            Review review;
            if (existingReview.isPresent()) {
                // Update existing review
                review = existingReview.get();
                review.setRating(request.getRating());
                review.setComment(request.getComment() != null ? request.getComment().trim() : "");
                review.setUpdatedAt(LocalDateTime.now());
            } else {
                // Create new review
                review = new Review();
                review.setMovieId(request.getMovieId());
                review.setUserId(userId);
                review.setUserName(userName);
                review.setRating(request.getRating());
                review.setComment(request.getComment() != null ? request.getComment().trim() : "");
                review.setCreatedAt(LocalDateTime.now());
                review.setUpdatedAt(LocalDateTime.now());
            }
            
            Review saved = reviewRepository.save(review);
            return convertToDTO(saved);
        } catch (Exception e) {
            throw new RuntimeException("Failed to save review: " + e.getMessage(), e);
        }
    }

    public List<ReviewDTO> getMovieReviews(String movieId) {
        return reviewRepository.findByMovieIdOrderByCreatedAtDesc(movieId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public Double getAverageRating(String movieId) {
        Aggregation aggregation = Aggregation.newAggregation(
            Aggregation.match(Criteria.where("movieId").is(movieId)),
            Aggregation.group().avg("rating").as("averageRating")
        );
        
        AggregationResults<AverageRatingResult> results = mongoTemplate.aggregate(
            aggregation, "reviews", AverageRatingResult.class
        );
        
        AverageRatingResult result = results.getUniqueMappedResult();
        return result != null ? result.getAverageRating() : 0.0;
    }

    public Long getReviewCount(String movieId) {
        return reviewRepository.countByMovieId(movieId);
    }

    public List<ReviewDTO> getUserReviews(String userId) {
        return reviewRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public void deleteReview(String reviewId, String userId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found"));
        
        if (!review.getUserId().equals(userId)) {
            throw new RuntimeException("You can only delete your own reviews");
        }
        
        reviewRepository.delete(review);
    }

    private ReviewDTO convertToDTO(Review review) {
        return new ReviewDTO(
            review.getId(),
            review.getMovieId(),
            review.getUserId(),
            review.getUserName(),
            review.getRating(),
            review.getComment(),
            review.getCreatedAt(),
            review.getUpdatedAt()
        );
    }

    public static class AverageRatingResult {
        private Double averageRating;
        
        public Double getAverageRating() {
            return averageRating;
        }
        
        public void setAverageRating(Double averageRating) {
            this.averageRating = averageRating;
        }
    }
}