package com.revticket.controller;

import com.revticket.dto.ApiResponse;
import com.revticket.dto.ReviewResponse;
import com.revticket.service.ReviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/reviews")
@CrossOrigin(origins = {"http://localhost:4200", "*"})
@PreAuthorize("hasRole('ADMIN')")
public class AdminReviewController {

    @Autowired
    private ReviewService reviewService;

    @GetMapping("/pending")
    public ResponseEntity<ApiResponse<List<ReviewResponse>>> getPendingReviews() {
        List<ReviewResponse> reviews = reviewService.getAllPendingReviews();
        return ResponseEntity.ok(new ApiResponse<>(true, reviews, "Pending reviews retrieved"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ReviewResponse>>> getAllReviews() {
        List<ReviewResponse> reviews = reviewService.getAllReviews();
        return ResponseEntity.ok(new ApiResponse<>(true, reviews, "All reviews retrieved"));
    }

    @GetMapping("/movie/{movieId}")
    public ResponseEntity<ApiResponse<List<ReviewResponse>>> getMovieReviews(@PathVariable String movieId) {
        List<ReviewResponse> reviews = reviewService.getAllReviewsForMovie(movieId);
        return ResponseEntity.ok(new ApiResponse<>(true, reviews, "Movie reviews retrieved"));
    }

    @PatchMapping("/{reviewId}/approve")
    public ResponseEntity<ApiResponse<ReviewResponse>> approveReview(@PathVariable String reviewId) {
        ReviewResponse review = reviewService.approveReview(reviewId);
        return ResponseEntity.ok(new ApiResponse<>(true, review, "Review approved"));
    }

    @DeleteMapping("/{reviewId}")
    public ResponseEntity<ApiResponse<Void>> deleteReview(@PathVariable String reviewId) {
        reviewService.deleteReview(reviewId);
        return ResponseEntity.ok(new ApiResponse<>(true, null, "Review deleted"));
    }
}
