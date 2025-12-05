package com.revticket.controller;

import com.revticket.dto.SettingsDTO;
import com.revticket.service.SettingsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:4200")
public class SettingsController {

    @Autowired
    private SettingsService settingsService;

    @GetMapping("/settings")
    public ResponseEntity<SettingsDTO> getSettings() {
        return ResponseEntity.ok(settingsService.getSettings());
    }

    @PutMapping("/admin/settings")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SettingsDTO> updateSettings(@RequestBody SettingsDTO settings) {
        return ResponseEntity.ok(settingsService.updateSettings(settings));
    }
}
