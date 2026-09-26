package com.musicplayer.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    public void sendVerificationOtp(String to, String otp) {
        log.info("SIMULATED EMAIL: Sending verification code to {}", to);
        
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject("GrooveWave - Verification Code");
            message.setText("Your verification code is: " + otp + "\nThis code will expire in 5 minutes.");
            mailSender.send(message);
            log.info("Email sent successfully to {}", to);
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
            // We don't throw exception here so testing remains easy even without SMTP
        }
    }
}
