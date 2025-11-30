package com.revticket.controller;

import com.revticket.dto.ScreenResponse;
import com.revticket.entity.Screen;
import com.revticket.repository.ScreenRepository;
import com.revticket.service.ScreenService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/screens")
@CrossOrigin(origins = { "http://localhost:4200", "*" })
@PreAuthorize("hasRole('ADMIN')")
public class AdminScreenController {

    @Autowired
    private ScreenService screenService;

    @Autowired
    private ScreenRepository screenRepository;

    @GetMapping
    public ResponseEntity<List<ScreenResponse>> getScreens(
            @RequestParam(name = "theatreId", required = false) String theatreId,
            @RequestParam(name = "activeOnly", required = false, defaultValue = "true") Boolean activeOnly) {
        if (theatreId != null && !theatreId.isBlank()) {
            return ResponseEntity.ok(screenService.getScreensByTheater(theatreId, activeOnly));
        }

        List<Screen> screens = screenRepository.findAll();
        List<ScreenResponse> response = screens.stream()
                .map(screen -> ScreenResponse.builder()
                        .id(screen.getId())
                        .name(screen.getName())
                        .totalSeats(screen.getTotalSeats())
                        .theaterId(screen.getTheater() != null ? screen.getTheater().getId() : null)
                        .isActive(screen.getIsActive())
                        .build())
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ScreenResponse> getScreenById(@PathVariable String id) {
        Screen screen = screenRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Screen not found"));

        ScreenResponse resp = ScreenResponse.builder()
                .id(screen.getId())
                .name(screen.getName())
                .totalSeats(screen.getTotalSeats())
                .theaterId(screen.getTheater() != null ? screen.getTheater().getId() : null)
                .isActive(screen.getIsActive())
                .build();

        return ResponseEntity.ok(resp);
    }

    @PostMapping
    public ResponseEntity<ScreenResponse> createScreen(@RequestBody CreateScreenRequest request) {
        ScreenResponse response = screenService.createScreen(
            request.getTheaterId(),
            request.getName(),
            request.getTotalSeats()
        );
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ScreenResponse> updateScreen(
            @PathVariable String id,
            @RequestBody CreateScreenRequest request) {
        Screen screen = screenRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Screen not found"));
        
        screen.setName(request.getName());
        screen.setTotalSeats(request.getTotalSeats());
        
        Screen updated = screenRepository.save(screen);
        
        ScreenResponse resp = ScreenResponse.builder()
                .id(updated.getId())
                .name(updated.getName())
                .totalSeats(updated.getTotalSeats())
                .theaterId(updated.getTheater() != null ? updated.getTheater().getId() : null)
                .isActive(updated.getIsActive())
                .build();
        
        return ResponseEntity.ok(resp);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteScreen(@PathVariable String id) {
        screenRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // DTO for creating/updating screens
    public static class CreateScreenRequest {
        private String name;
        private String theaterId;
        private Integer totalSeats;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        
        public String getTheaterId() { return theaterId; }
        public void setTheaterId(String theaterId) { this.theaterId = theaterId; }
        
        public Integer getTotalSeats() { return totalSeats; }
        public void setTotalSeats(Integer totalSeats) { this.totalSeats = totalSeats; }
    }
}
