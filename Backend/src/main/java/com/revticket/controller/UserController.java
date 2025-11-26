package com.revticket.controller;

import com.revticket.dto.UserDto;
import com.revticket.service.UserService;
import com.revticket.util.SecurityUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private SecurityUtil securityUtil;

    @GetMapping("/profile")
    public ResponseEntity<UserDto> getProfile(Authentication authentication) {
        String userId = securityUtil.getCurrentUserId(authentication);
        return ResponseEntity.ok(userService.getUserProfile(userId));
    }

    @PutMapping("/profile")
    public ResponseEntity<UserDto> updateProfile(
            @RequestBody UserDto userDto,
            Authentication authentication) {
        String userId = securityUtil.getCurrentUserId(authentication);
        return ResponseEntity.ok(userService.updateProfile(userId, userDto));
    }

    @PutMapping("/change-password")
    public ResponseEntity<String> changePassword(
            @RequestBody com.revticket.dto.PasswordChangeRequest request,
            Authentication authentication) {
        String userId = securityUtil.getCurrentUserId(authentication);
        userService.changePassword(userId, request);
        return ResponseEntity.ok("Password changed successfully");
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserDto>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }
}

