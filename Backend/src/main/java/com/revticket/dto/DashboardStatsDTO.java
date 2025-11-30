package com.revticket.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsDTO {
    private Long totalMovies;
    private Long totalBookings;
    private Double totalRevenue;
    private Long totalUsers;
    private Long todayBookings;
    private Long cancelledBookings;
    private Long activeMovies;
}
