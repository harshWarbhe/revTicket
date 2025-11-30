package com.revticket.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RevenueTrendDTO {
    private String date;
    private Double revenue;
    private Long bookings;
}
