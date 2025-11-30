package com.revticket.service;

import com.revticket.dto.ReviewRequest;
import com.revticket.dto.ReviewResponse;
import com.revticket.entity.Movie;
import com.revticket.entity.Review;
import com.revticket.entity.User;
import com.revticket.repository.MovieRepository;
import com.revticket.repository.ReviewRepository;
import com.revticket.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ReviewService {

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MovieRepository movieRepository;

    public ReviewResponse addReview(String userId, ReviewRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Movie movie = movieRepository.findById(request.getMovieId())
                .orElseThrow(() -> new RuntimeException("Movie not found"));

        // Check if user already reviewed this movie
        if (reviewRepository.findByUserIdAndMovieId(userId, request.getMovieId()).isPresent()) {
            throw new RuntimeException("You have already reviewed this movie");
        }

        Review review = new Review();
        review.setUser(user);
        review.setMovie(movie);
        review.setRating(request.getRating());
        review.setComment(request.getComment());

        review = reviewRepository.save(review);

        return new ReviewResponse(
                review.getId(),
                user.getName(),
                review.getRating(),
                review.getComment(),
                review.getCreatedAt()
        );
    }

    public List<ReviewResponse> getMovieReviews(String movieId) {
        return reviewRepository.findByMovieIdOrderByCreatedAtDesc(movieId)
                .stream()
                .map(review -> new ReviewResponse(
                        review.getId(),
                        review.getUser().getName(),
                        review.getRating(),
                        review.getComment(),
                        review.getCreatedAt()
                ))
                .collect(Collectors.toList());
    }

    public Double getAverageRating(String movieId) {
        return reviewRepository.getAverageRatingByMovieId(movieId);
    }
}