package com.revticket.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Document(collection = "reviews")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Review {
    @Id
    private String id;
    
    @Indexed
    private String movieId;
    
    @Indexed
    private String userId;
    
    private String userName;
    private Double rating;
    private String comment;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    public Review(String movieId, String userId, String userName, Double rating, String comment) {
        this.movieId = movieId;
        this.userId = userId;
        this.userName = userName;
        this.rating = rating;
        this.comment = comment != null ? comment.trim() : "";
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
}