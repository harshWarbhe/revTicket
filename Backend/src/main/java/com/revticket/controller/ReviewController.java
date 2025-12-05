package com.revticket.controller;

import com.revticket.dto.ApiResponse;
import com.revticket.dto.ReviewDTO;
import com.revticket.dto.ReviewRequest;
import com.revticket.entity.User;
import com.revticket.repository.UserRepository;
import com.revticket.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/reviews")
@CrossOrigin(origins = "*")
public class ReviewController {

    @Autowired
    private ReviewService reviewService;
    
    @Autowired
    private UserRepository userRepository;

    @PostMapping
    public ResponseEntity<ApiResponse<ReviewDTO>> addReview(
            @Valid @RequestBody ReviewRequest request,
            Authentication authentication) {
        try {
            String userId = authentication.getName();
            String userName = userId;
            
            // Get user name from database
            Optional<User> user = userRepository.findByEmail(userId);
            if (user.isPresent()) {
                userName = user.get().getName();
            }
            
            ReviewDTO review = reviewService.addReview(userId, userName, request);
            return ResponseEntity.ok(ApiResponse.<ReviewDTO>builder()
                    .success(true)
                    .data(review)
                    .message("Review added successfully")
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.<ReviewDTO>builder()
                    .success(false)
                    .message("Failed to add review: " + e.getMessage())
                    .build());
        }
    }

    @GetMapping("/movie/{movieId}")
    public ResponseEntity<ApiResponse<List<ReviewDTO>>> getMovieReviews(@PathVariable String movieId) {
        List<ReviewDTO> reviews = reviewService.getMovieReviews(movieId);
        return ResponseEntity.ok(ApiResponse.<List<ReviewDTO>>builder()
                .success(true)
                .data(reviews)
                .message("Reviews retrieved successfully")
                .build());
    }

    @GetMapping("/movie/{movieId}/rating")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMovieRating(@PathVariable String movieId) {
        Double averageRating = reviewService.getAverageRating(movieId);
        Long reviewCount = reviewService.getReviewCount(movieId);
        
        Map<String, Object> ratingData = Map.of(
            "averageRating", averageRating,
            "reviewCount", reviewCount
        );
        
        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder()
                .success(true)
                .data(ratingData)
                .message("Rating retrieved successfully")
                .build());
    }

    @GetMapping("/user")
    public ResponseEntity<ApiResponse<List<ReviewDTO>>> getUserReviews(Authentication authentication) {
        String userId = authentication.getName();
        List<ReviewDTO> reviews = reviewService.getUserReviews(userId);
        return ResponseEntity.ok(ApiResponse.<List<ReviewDTO>>builder()
                .success(true)
                .data(reviews)
                .message("User reviews retrieved successfully")
                .build());
    }

    @DeleteMapping("/{reviewId}")
    public ResponseEntity<ApiResponse<Void>> deleteReview(
            @PathVariable String reviewId,
            Authentication authentication) {
        try {
            String userId = authentication.getName();
            reviewService.deleteReview(reviewId, userId);
            return ResponseEntity.ok(ApiResponse.<Void>builder()
                    .success(true)
                    .message("Review deleted successfully")
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.<Void>builder()
                    .success(false)
                    .message("Failed to delete review: " + e.getMessage())
                    .build());
        }
    }
}