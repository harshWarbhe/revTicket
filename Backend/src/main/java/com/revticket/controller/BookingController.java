package com.revticket.controller;

import com.revticket.dto.BookingRequest;
import com.revticket.dto.BookingResponse;
import com.revticket.service.BookingService;
import com.revticket.util.SecurityUtil;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin(origins = "*")
public class BookingController {

    @Autowired
    private BookingService bookingService;

    @Autowired
    private SecurityUtil securityUtil;

    @PostMapping
    public ResponseEntity<BookingResponse> createBooking(
            @Valid @RequestBody BookingRequest request,
            Authentication authentication) {
        String userId = securityUtil.getCurrentUserId(authentication);
        return ResponseEntity.ok(bookingService.createBooking(userId, request));
    }

    @GetMapping("/my-bookings")
    public ResponseEntity<List<BookingResponse>> getMyBookings(Authentication authentication) {
        String userId = securityUtil.getCurrentUserId(authentication);
        return ResponseEntity.ok(bookingService.getUserBookings(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BookingResponse> getBookingById(@PathVariable("id") String id) {
        return bookingService.getBookingById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<BookingResponse> cancelBooking(
            @PathVariable("id") String id,
            @RequestBody(required = false) String reason) {
        return ResponseEntity.ok(bookingService.cancelBooking(id, reason));
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<BookingResponse>> getAllBookings() {
        return ResponseEntity.ok(bookingService.getAllBookings());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteBooking(@PathVariable("id") String id) {
        bookingService.deleteBooking(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/scan")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BookingResponse> scanBooking(@PathVariable("id") String id) {
        return ResponseEntity.ok(bookingService.scanBooking(id));
    }

    @PostMapping("/{id}/resign")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BookingResponse> resignBooking(
            @PathVariable("id") String id,
            @RequestBody List<String> newSeats) {
        return ResponseEntity.ok(bookingService.resignBooking(id, newSeats));
    }
}

