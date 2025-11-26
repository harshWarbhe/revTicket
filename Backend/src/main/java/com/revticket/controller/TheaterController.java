package com.revticket.controller;

import com.revticket.dto.TheaterRequest;
import com.revticket.dto.TheaterResponse;
import com.revticket.service.TheaterService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/theaters")
@CrossOrigin(origins = "*")
public class TheaterController {

    @Autowired
    private TheaterService theaterService;

    @GetMapping
    public ResponseEntity<List<TheaterResponse>> getAllTheaters(
            @RequestParam(name = "activeOnly", defaultValue = "true") boolean activeOnly) {
        return ResponseEntity.ok(theaterService.getAllTheaters(activeOnly));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TheaterResponse> getTheaterById(@PathVariable String id) {
        return theaterService.getTheaterById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TheaterResponse> createTheater(@Valid @RequestBody TheaterRequest request) {
        return ResponseEntity.ok(theaterService.createTheater(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TheaterResponse> updateTheater(@PathVariable String id,
                                                         @Valid @RequestBody TheaterRequest request) {
        return ResponseEntity.ok(theaterService.updateTheater(id, request));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TheaterResponse> updateTheaterStatus(@PathVariable String id,
                                                               @RequestParam boolean active) {
        return ResponseEntity.ok(theaterService.updateTheaterStatus(id, active));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteTheater(@PathVariable String id) {
        theaterService.deleteTheater(id);
        return ResponseEntity.ok().build();
    }
}

