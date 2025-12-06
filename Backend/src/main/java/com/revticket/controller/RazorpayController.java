package com.revticket.controller;

import com.revticket.dto.RazorpayOrderRequest;
import com.revticket.dto.RazorpayOrderResponse;
import com.revticket.dto.RazorpayVerificationRequest;
import com.revticket.entity.Booking;
import com.revticket.service.RazorpayService;
import com.revticket.util.SecurityUtil;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/razorpay")
@CrossOrigin(origins = "*")
public class RazorpayController {

    @Autowired
    private RazorpayService razorpayService;

    @Autowired
    private SecurityUtil securityUtil;

    @PostMapping("/create-order")
    public ResponseEntity<?> createOrder(@Valid @RequestBody RazorpayOrderRequest request) {
        try {
            RazorpayOrderResponse response = razorpayService.createOrder(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to create Razorpay order: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @PostMapping("/verify-payment")
    public ResponseEntity<?> verifyPayment(
            @Valid @RequestBody RazorpayVerificationRequest request,
            Authentication authentication) {
        try {
            String userId = securityUtil.getCurrentUserId(authentication);
            Booking booking = razorpayService.verifyPaymentAndCreateBooking(userId, request);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Payment verified successfully");
            response.put("bookingId", booking.getId());
            response.put("ticketNumber", booking.getTicketNumber());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("success", "false");
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @PostMapping("/payment-failed")
    public ResponseEntity<?> paymentFailed(
            @RequestBody RazorpayVerificationRequest request,
            Authentication authentication) {
        try {
            String userId = securityUtil.getCurrentUserId(authentication);
            razorpayService.handlePaymentFailure(userId, request);

            Map<String, String> response = new HashMap<>();
            response.put("message", "Payment failure recorded");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
}
