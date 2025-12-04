package com.revticket.dto;

import lombok.Data;

@Data
public class OAuth2LoginRequest {
    private String token;
    private String provider; // "google", "facebook", etc.
    private String email;
    private String name;
    private String picture;
}
