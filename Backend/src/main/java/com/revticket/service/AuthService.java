package com.revticket.service;

import com.revticket.dto.AuthResponse;
import com.revticket.dto.LoginRequest;
import com.revticket.dto.OAuth2LoginRequest;
import com.revticket.dto.SignupRequest;
import com.revticket.dto.UserDto;
import com.revticket.entity.User;
import com.revticket.repository.UserRepository;
import com.revticket.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired(required = false)
    private EmailService emailService;

    @Autowired(required = false)
    private SettingsService settingsService;

    @org.springframework.beans.factory.annotation.Value("${app.frontend.url:http://localhost:4200}")
    private String frontendUrl;

    public AuthResponse login(LoginRequest request) {
        try {
            // Authenticate user - this will verify password using BCrypt
            // If authentication fails, it will throw AuthenticationException
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

            // Get user from database (authentication succeeded, so user exists)
            User user = userRepository.findByEmail(request.getEmail())
                    .orElseThrow(() -> new BadCredentialsException("User not found"));

            // Normalize role to handle case-insensitive values from database
            String role = normalizeRole(user.getRole());

            // Generate JWT token with normalized role
            String token = jwtUtil.generateToken(user.getEmail(), role);
            UserDto userDto = convertToDto(user);

            return new AuthResponse(token, userDto);
        } catch (AuthenticationException e) {
            // Re-throw authentication exceptions with clear message
            throw new BadCredentialsException("Invalid email or password");
        }
    }

    /**
     * Normalize role to handle case-insensitive role values from database
     */
    private String normalizeRole(User.Role role) {
        if (role == null) {
            return "USER";
        }
        // Enum name() already returns uppercase, but handle any case issues
        String roleStr = role.name();
        if (roleStr.equalsIgnoreCase("ADMIN")) {
            return "ADMIN";
        }
        return "USER";
    }

    public AuthResponse signup(SignupRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setName(request.getName());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setPhone(request.getPhone());
        user.setDateOfBirth(request.getDateOfBirth());
        user.setGender(request.getGender());
        user.setAddress(request.getAddress());
        user.setPreferredLanguage(request.getPreferredLanguage() != null ? request.getPreferredLanguage() : "English");
        user.setRole(User.Role.USER);

        user = userRepository.save(user);

        if (emailService != null && settingsService != null && settingsService.areEmailNotificationsEnabled()) {
            try {
                emailService.sendAdminNewUserNotification(user.getName(), user.getEmail());
            } catch (Exception e) {
                System.out.println("Failed to send admin notification: " + e.getMessage());
            }
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        UserDto userDto = convertToDto(user);

        return new AuthResponse(token, userDto);
    }

    public void forgotPassword(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Email not found"));
        
        String resetToken = UUID.randomUUID().toString();
        user.setResetToken(resetToken);
        user.setResetTokenExpiry(LocalDateTime.now().plusHours(1));
        userRepository.save(user);
        
        if (emailService != null) {
            try {
                emailService.sendPasswordResetEmail(email, resetToken);
            } catch (Exception e) {
                System.out.println("\n=== EMAIL SEND FAILED ===");
                System.out.println("Reset Token: " + resetToken);
                System.out.println("Reset URL: " + frontendUrl + "/auth/reset-password?token=" + resetToken);
                System.out.println("========================\n");
            }
        } else {
            System.out.println("\n=== EMAIL SERVICE NOT CONFIGURED ===");
            System.out.println("Reset Token: " + resetToken);
            System.out.println("Reset URL: http://localhost:4200/auth/reset-password?token=" + resetToken);
            System.out.println("===================================\n");
        }
    }

    public void resetPassword(String token, String newPassword) {
        User user = userRepository.findByResetToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid reset token"));
        
        if (user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Reset token has expired");
        }
        
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        userRepository.save(user);
    }

    public AuthResponse oauth2Login(OAuth2LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseGet(() -> {
                    User newUser = new User();
                    newUser.setEmail(request.getEmail());
                    newUser.setName(request.getName());
                    newUser.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
                    newUser.setRole(User.Role.USER);
                    return userRepository.save(newUser);
                });

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        UserDto userDto = convertToDto(user);
        return new AuthResponse(token, userDto);
    }

    private UserDto convertToDto(User user) {
        return new UserDto(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getRole().name(),
                user.getPhone(),
                user.getDateOfBirth(),
                user.getGender(),
                user.getAddress(),
                user.getPreferredLanguage(),
                user.getEmailNotifications(),
                user.getSmsNotifications(),
                user.getPushNotifications(),
                user.getCreatedAt());
    }
}
