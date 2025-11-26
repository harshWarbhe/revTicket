package com.revticket.controller;

import com.revticket.entity.Seat;
import com.revticket.service.SeatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/seats")
@CrossOrigin(origins = "*")
public class SeatController {

    @Autowired
    private SeatService seatService;

    @GetMapping("/showtime/{showtimeId}")
    public ResponseEntity<List<Seat>> getSeatsByShowtime(@PathVariable String showtimeId) {
        return ResponseEntity.ok(seatService.getSeatsByShowtime(showtimeId));
    }

    @PostMapping("/showtime/{showtimeId}/initialize")
    public ResponseEntity<?> initializeSeats(@PathVariable String showtimeId) {
        seatService.initializeSeatsForShowtime(showtimeId);
        return ResponseEntity.ok().body("Seats initialized successfully");
    }

    @PostMapping("/hold")
    public ResponseEntity<Map<String, String>> holdSeats(@RequestBody Map<String, Object> request) {
        String showtimeId = (String) request.get("showtimeId");
        @SuppressWarnings("unchecked")
        List<String> seatIds = (List<String>) request.get("seatIds");
        String sessionId = (String) request.get("sessionId");
        
        seatService.holdSeats(showtimeId, seatIds, sessionId);
        return ResponseEntity.ok(Map.of("message", "Seats held successfully"));
    }

    @PostMapping("/release")
    public ResponseEntity<Map<String, String>> releaseSeats(@RequestBody Map<String, Object> request) {
        String showtimeId = (String) request.get("showtimeId");
        @SuppressWarnings("unchecked")
        List<String> seatIds = (List<String>) request.get("seatIds");
        
        seatService.releaseSeats(showtimeId, seatIds);
        return ResponseEntity.ok(Map.of("message", "Seats released successfully"));
    }
}

