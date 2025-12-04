package com.revticket.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${app.frontend.url:http://localhost:4200}")
    private String frontendUrl;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public void sendPasswordResetEmail(String toEmail, String resetToken) {
        String resetUrl = frontendUrl + "/auth/reset-password?token=" + resetToken;
        
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject("RevTicket - Password Reset Request");
        message.setText(buildResetEmailBody(resetUrl));
        
        mailSender.send(message);
    }

    private String buildResetEmailBody(String resetUrl) {
        return "Hello,\n\n" +
               "You have requested to reset your password for your RevTicket account.\n\n" +
               "Please click the link below to reset your password:\n" +
               resetUrl + "\n\n" +
               "This link will expire in 1 hour.\n\n" +
               "If you did not request this password reset, please ignore this email.\n\n" +
               "Best regards,\n" +
               "RevTicket Team";
    }
}
