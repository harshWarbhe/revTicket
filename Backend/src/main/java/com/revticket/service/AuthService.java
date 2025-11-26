package com.revticket.service;

import com.revticket.dto.AuthResponse;
import com.revticket.dto.LoginRequest;
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

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        UserDto userDto = convertToDto(user);

        return new AuthResponse(token, userDto);
    }

    public void forgotPassword(String email) {
        userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Email not found"));
        // Send reset email
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
