package com.revticket.controller;

import com.revticket.dto.ScreenResponse;
import com.revticket.entity.Screen;
import com.revticket.repository.ScreenRepository;
import com.revticket.service.ScreenService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

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
}
