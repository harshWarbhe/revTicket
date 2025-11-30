package com.revticket.controller;

import com.revticket.dto.*;
import com.revticket.service.BookingReportService;
import com.revticket.service.BookingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
@RequestMapping("/api/admin/reports")
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('ADMIN')")
public class AdminReportController {

    @Autowired
    private BookingReportService reportService;

    @Autowired
    private BookingService bookingService;

    @GetMapping("/summary")
    public ResponseEntity<BookingReportSummary> getSummary(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        return ResponseEntity.ok(reportService.getSummary(fromDate, toDate));
    }

    @GetMapping("/revenue-trend")
    public ResponseEntity<List<RevenueTrendDTO>> getRevenueTrend(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        return ResponseEntity.ok(reportService.getRevenueTrend(fromDate, toDate));
    }

    @GetMapping("/bookings")
    public ResponseEntity<Page<BookingResponse>> getFilteredBookings(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) String theaterId,
            @RequestParam(required = false) String movieId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String searchTerm,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "10") Integer size) {
        
        BookingReportFilter filter = new BookingReportFilter();
        filter.setFromDate(fromDate);
        filter.setToDate(toDate);
        filter.setTheaterId(theaterId);
        filter.setMovieId(movieId);
        filter.setStatus(status);
        filter.setSearchTerm(searchTerm);
        filter.setPage(page);
        filter.setSize(size);

        return ResponseEntity.ok(reportService.getFilteredBookings(filter));
    }

    @GetMapping("/bookings/{id}")
    public ResponseEntity<BookingResponse> getBookingDetails(@PathVariable String id) {
        return bookingService.getBookingById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/export/csv")
    public ResponseEntity<String> exportCSV(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) String theaterId,
            @RequestParam(required = false) String movieId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String searchTerm) {
        
        BookingReportFilter filter = new BookingReportFilter();
        filter.setFromDate(fromDate);
        filter.setToDate(toDate);
        filter.setTheaterId(theaterId);
        filter.setMovieId(movieId);
        filter.setStatus(status);
        filter.setSearchTerm(searchTerm);
        filter.setPage(0);
        filter.setSize(10000);

        Page<BookingResponse> bookings = reportService.getFilteredBookings(filter);
        
        StringBuilder csv = new StringBuilder();
        csv.append("Booking ID,Customer Name,Email,Phone,Movie,Theater,Screen,Show Date,Seats,Amount,Status,Booking Date\n");
        
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
        
        bookings.getContent().forEach(booking -> {
            csv.append(String.format("\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",%.2f,\"%s\",\"%s\"\n",
                booking.getId(),
                booking.getCustomerName(),
                booking.getCustomerEmail(),
                booking.getCustomerPhone(),
                booking.getMovieTitle(),
                booking.getTheaterName(),
                booking.getScreen(),
                booking.getShowtime().format(formatter),
                String.join("; ", booking.getSeats()),
                booking.getTotalAmount(),
                booking.getStatus(),
                booking.getBookingDate().format(formatter)
            ));
        });

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv"));
        headers.setContentDispositionFormData("attachment", "bookings-report.csv");

        return ResponseEntity.ok()
                .headers(headers)
                .body(csv.toString());
    }
}
