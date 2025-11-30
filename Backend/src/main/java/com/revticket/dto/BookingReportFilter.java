package com.revticket.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class BookingReportFilter {
    private LocalDate fromDate;
    private LocalDate toDate;
    private String theaterId;
    private String movieId;
    private String status;
    private String searchTerm;
    private Integer page = 0;
    private Integer size = 10;
}
