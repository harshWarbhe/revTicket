package com.revticket.controller;

import com.revticket.dto.*;
import com.revticket.entity.Screen;
import com.revticket.entity.SeatCategory;
import com.revticket.entity.SeatData;
import com.revticket.repository.ScreenRepository;
import com.revticket.repository.SeatCategoryRepository;
import com.revticket.repository.SeatDataRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/screens")
@CrossOrigin(origins = {"http://localhost:4200", "*"})
public class ScreenController {

    @Autowired
    private ScreenRepository screenRepository;

    @Autowired
    private SeatCategoryRepository seatCategoryRepository;

    @Autowired
    private SeatDataRepository seatDataRepository;

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

    @GetMapping("/{id}/config")
    public ResponseEntity<ScreenConfigDTO> getScreenConfig(@PathVariable String id) {
        Screen screen = screenRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Screen not found"));

        List<SeatCategory> categories = seatCategoryRepository.findByScreenId(id);
        List<SeatData> seatData = seatDataRepository.findByScreenId(id);

        ScreenConfigDTO config = new ScreenConfigDTO();
        config.setId(screen.getId());
        config.setName(screen.getName());
        config.setTheatreId(screen.getTheater() != null ? screen.getTheater().getId() : null);
        config.setRows(screen.getRows() != null ? screen.getRows() : 10);
        config.setSeatsPerRow(screen.getSeatsPerRow() != null ? screen.getSeatsPerRow() : 15);
        config.setTotalSeats(screen.getTotalSeats());
        config.setCategories(categories != null ? categories.stream()
                .map(c -> new CategoryDTO(c.getId(), c.getName(), c.getPrice(), c.getColor()))
                .collect(Collectors.toList()) : new java.util.ArrayList<>());
        config.setSeatMap(seatData != null ? seatData.stream()
                .map(s -> new SeatDataDTO(s.getSeatId(), s.getLabel(), s.getRow(), s.getCol(), s.getCategoryId(), s.getStatus()))
                .collect(Collectors.toList()) : new java.util.ArrayList<>());

        return ResponseEntity.ok(config);
    }
}
