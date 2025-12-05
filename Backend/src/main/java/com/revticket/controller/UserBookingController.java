package com.revticket.controller;

import com.revticket.dto.ApiResponse;
import com.revticket.service.UserBookingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user/bookings")
@CrossOrigin(origins = "*")
public class UserBookingController {

    @Autowired
    private UserBookingService userBookingService;

    @GetMapping("/can-review/{movieId}")
    public ResponseEntity<ApiResponse<Boolean>> canUserReviewMovie(
            @PathVariable String movieId,
            Authentication authentication) {
        
        String userId = authentication.getName();
        boolean canReview = userBookingService.hasUserWatchedMovie(userId, movieId);
        
        return ResponseEntity.ok(ApiResponse.<Boolean>builder()
                .success(true)
                .data(canReview)
                .message(canReview ? "User can review this movie" : "User must watch the movie first")
                .build());
    }
}