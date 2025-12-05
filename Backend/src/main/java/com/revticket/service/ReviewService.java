package com.revticket.service;

import com.revticket.dto.ReviewRequest;
import com.revticket.dto.ReviewResponse;
import com.revticket.entity.Booking;
import com.revticket.entity.MongoReview;
import com.revticket.entity.Movie;
import com.revticket.entity.User;
import com.revticket.repository.BookingRepository;
import com.revticket.repository.MongoReviewRepository;
import com.revticket.repository.MovieRepository;
import com.revticket.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ReviewService {

    @Autowired
    private MongoReviewRepository mongoReviewRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MovieRepository movieRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private NotificationService notificationService;

    public ReviewResponse addReview(String userId, ReviewRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Movie movie = movieRepository.findById(request.getMovieId())
                .orElseThrow(() -> new RuntimeException("Movie not found"));

        if (mongoReviewRepository.findByUserIdAndMovieId(userId, request.getMovieId()).isPresent()) {
            throw new RuntimeException("You have already reviewed this movie");
        }

        // Check if user has watched the movie
        boolean hasWatchedMovie = bookingRepository.findByUserId(userId).stream()
                .anyMatch(booking -> 
                    booking.getStatus() == Booking.BookingStatus.CONFIRMED &&
                    booking.getShowtime().getMovie().getId().equals(request.getMovieId()) &&
                    booking.getShowtime().getShowDateTime().isBefore(LocalDateTime.now())
                );

        if (!hasWatchedMovie) {
            throw new RuntimeException("You can only review movies you have watched");
        }

        MongoReview review = new MongoReview();
        review.setUserId(userId);
        review.setUserName(user.getName());
        review.setMovieId(request.getMovieId());
        review.setMovieTitle(movie.getTitle());
        review.setRating(request.getRating());
        review.setComment(request.getComment());
        review.setCreatedAt(LocalDateTime.now());
        review.setApproved(false);

        review = mongoReviewRepository.save(review);
        
        // Send notification
        notificationService.notifyReviewSubmitted(movie.getTitle());

        return new ReviewResponse(
                review.getId(),
                review.getUserName(),
                review.getRating(),
                review.getComment(),
                review.getCreatedAt(),
                review.isApproved()
        );
    }

    public List<ReviewResponse> getMovieReviews(String movieId) {
        return mongoReviewRepository.findByMovieIdAndApprovedTrueOrderByCreatedAtDesc(movieId)
                .stream()
                .map(review -> new ReviewResponse(
                        review.getId(),
                        review.getUserName(),
                        review.getRating(),
                        review.getComment(),
                        review.getCreatedAt(),
                        review.isApproved()
                ))
                .collect(Collectors.toList());
    }

    public Double getAverageRating(String movieId) {
        List<MongoReview> reviews = mongoReviewRepository.findByMovieIdAndApprovedTrueOrderByCreatedAtDesc(movieId);
        return reviews.isEmpty() ? 0.0 : reviews.stream()
                .mapToInt(MongoReview::getRating)
                .average()
                .orElse(0.0);
    }

    public List<ReviewResponse> getAllPendingReviews() {
        return mongoReviewRepository.findByApprovedFalseOrderByCreatedAtDesc()
                .stream()
                .map(review -> new ReviewResponse(
                        review.getId(),
                        review.getUserName(),
                        review.getRating(),
                        review.getComment(),
                        review.getCreatedAt(),
                        review.isApproved(),
                        review.getMovieId(),
                        review.getMovieTitle()
                ))
                .collect(Collectors.toList());
    }

    public List<ReviewResponse> getAllReviewsForMovie(String movieId) {
        return mongoReviewRepository.findByMovieIdOrderByCreatedAtDesc(movieId)
                .stream()
                .map(review -> new ReviewResponse(
                        review.getId(),
                        review.getUserName(),
                        review.getRating(),
                        review.getComment(),
                        review.getCreatedAt(),
                        review.isApproved()
                ))
                .collect(Collectors.toList());
    }

    public ReviewResponse approveReview(String reviewId) {
        MongoReview review = mongoReviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found"));
        review.setApproved(true);
        review = mongoReviewRepository.save(review);
        return new ReviewResponse(
                review.getId(),
                review.getUserName(),
                review.getRating(),
                review.getComment(),
                review.getCreatedAt(),
                review.isApproved(),
                review.getMovieId(),
                review.getMovieTitle()
        );
    }

    public void deleteReview(String reviewId) {
        mongoReviewRepository.deleteById(reviewId);
    }

    public List<ReviewResponse> getAllReviews() {
        return mongoReviewRepository.findAll()
                .stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(review -> new ReviewResponse(
                        review.getId(),
                        review.getUserName(),
                        review.getRating(),
                        review.getComment(),
                        review.getCreatedAt(),
                        review.isApproved(),
                        review.getMovieId(),
                        review.getMovieTitle()
                ))
                .collect(Collectors.toList());
    }

    public boolean canUserReviewMovie(String userId, String movieId) {
        // Check if already reviewed
        if (mongoReviewRepository.findByUserIdAndMovieId(userId, movieId).isPresent()) {
            return false;
        }

        // Check if user has watched the movie
        return bookingRepository.findByUserId(userId).stream()
                .anyMatch(booking -> 
                    booking.getStatus() == Booking.BookingStatus.CONFIRMED &&
                    booking.getShowtime().getMovie().getId().equals(movieId) &&
                    booking.getShowtime().getShowDateTime().isBefore(LocalDateTime.now())
                );
    }
}