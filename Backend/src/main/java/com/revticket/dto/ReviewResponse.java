package com.revticket.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class ReviewResponse {
    private String id;
    private String userName;
    private Integer rating;
    private String comment;
    private LocalDateTime createdAt;
}