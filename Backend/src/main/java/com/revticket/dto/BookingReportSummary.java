package com.revticket.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingReportSummary {
    private Long totalBookings;
    private Double totalRevenue;
    private Long cancelledBookings;
    private Double totalRefunds;
    private Long todayBookings;
    private Double avgTicketPrice;
}
