package com.revticket.dto;

import lombok.Data;

@Data
public class ReviewRequest {
    private String movieId;
    private Integer rating;
    private String comment;
}