package com.revticket.controller;

import com.revticket.dto.ScreenResponse;
import com.revticket.entity.Screen;
import com.revticket.repository.ScreenRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/screens")
@CrossOrigin(origins = {"http://localhost:4200", "*"})
public class ScreenController {

    @Autowired
    private ScreenRepository screenRepository;

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
