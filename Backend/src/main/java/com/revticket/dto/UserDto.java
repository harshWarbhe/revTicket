package com.revticket.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {
    private String id;
    private String email;
    private String name;
    private String role;
    private String phone;
    private java.time.LocalDate dateOfBirth;
    private String gender;
    private String address;
    private String preferredLanguage;
    private Boolean emailNotifications;
    private Boolean smsNotifications;
    private Boolean pushNotifications;
    private LocalDateTime createdAt;
}

