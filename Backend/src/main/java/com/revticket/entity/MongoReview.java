package com.revticket.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "reviews")
@CompoundIndex(name = "user_movie_idx", def = "{'userId': 1, 'movieId': 1}", unique = true)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MongoReview {
    @Id
    private String id;
    private String userId;
    private String userName;
    private String movieId;
    private String movieTitle;
    private Integer rating;
    private String comment;
    private LocalDateTime createdAt;
    private boolean approved;
}
