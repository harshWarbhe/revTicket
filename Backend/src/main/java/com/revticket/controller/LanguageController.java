package com.revticket.controller;

import com.revticket.entity.Language;
import com.revticket.service.LanguageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/languages")
@CrossOrigin(origins = "*")
public class LanguageController {

    @Autowired
    private LanguageService languageService;

    @GetMapping
    public ResponseEntity<List<Language>> getAllLanguages() {
        return ResponseEntity.ok(languageService.getAllActiveLanguages());
    }

    @PostMapping("/init")
    public ResponseEntity<String> initializeLanguages() {
        languageService.initializeDefaultLanguages();
        return ResponseEntity.ok("Languages initialized successfully");
    }
}
