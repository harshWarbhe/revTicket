package com.revticket.controller;

import com.revticket.dto.ShowtimeRequest;
import com.revticket.dto.ShowtimeResponse;
import com.revticket.service.ShowtimeService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/showtimes")
@CrossOrigin(origins = "*")
public class ShowtimeController {

    @Autowired
    private ShowtimeService showtimeService;

    @GetMapping
    public ResponseEntity<List<ShowtimeResponse>> getShowtimes(
            @RequestParam(required = false) String movieId,
            @RequestParam(required = false) String theaterId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        if (movieId != null && date != null) {
            return ResponseEntity.ok(showtimeService.getShowtimesByMovieAndDate(movieId, date));
        }
        if (movieId != null) {
            return ResponseEntity.ok(showtimeService.getShowtimesByMovie(movieId));
        }
        if (theaterId != null) {
            return ResponseEntity.ok(showtimeService.getShowtimesByTheater(theaterId));
        }
        return ResponseEntity.ok(showtimeService.getAllShowtimes());
    }

    @GetMapping("/movie/{movieId}")
    public ResponseEntity<List<ShowtimeResponse>> getShowtimesByMovie(
            @PathVariable String movieId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        if (date != null) {
            return ResponseEntity.ok(showtimeService.getShowtimesByMovieAndDate(movieId, date));
        }
        return ResponseEntity.ok(showtimeService.getShowtimesByMovie(movieId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ShowtimeResponse> getShowtimeById(@PathVariable String id) {
        return showtimeService.getShowtimeById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ShowtimeResponse> createShowtime(@Valid @RequestBody ShowtimeRequest request) {
        return ResponseEntity.ok(showtimeService.createShowtime(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ShowtimeResponse> updateShowtime(@PathVariable String id,
                                                           @Valid @RequestBody ShowtimeRequest request) {
        return ResponseEntity.ok(showtimeService.updateShowtime(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteShowtime(@PathVariable String id) {
        showtimeService.deleteShowtime(id);
        return ResponseEntity.ok().build();
    }
}

