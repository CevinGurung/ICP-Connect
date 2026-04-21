package com.icpconnect.backend.service;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Random;
import java.util.concurrent.TimeUnit;

@Service
public class OtpService {

    // Internal Memory Cache configured with absolute 5 minute time-to-live rule
    private final Cache<String, OtpDetails> otpCache = Caffeine.newBuilder()
            .expireAfterWrite(5, TimeUnit.MINUTES)
            .maximumSize(10000)
            .build();

    private final EmailService emailService;

    public OtpService(EmailService emailService) {
        this.emailService = emailService;
    }

    public void generateAndSendOtp(String email, String purpose) {
        // Normalize email to prevent case-sensitive cache misses
        String normalizedEmail = email.trim().toLowerCase();
        
        OtpDetails existing = otpCache.getIfPresent(normalizedEmail);

        if (existing != null) {
            long secondsSinceLast = java.time.Duration.between(existing.getLastSentAt(), LocalDateTime.now()).getSeconds();
            if (secondsSinceLast < 30) {
                throw new IllegalArgumentException("Too soon! Please wait another " + (30 - secondsSinceLast) + "s before requesting a new OTP.");
            }
        }

        // Generate rigorous 6-digit zero-padded OTP
        String newOtp = String.format("%06d", new Random().nextInt(1000000));
        
        OtpDetails details = new OtpDetails(newOtp, LocalDateTime.now());
        otpCache.put(normalizedEmail, details);

        emailService.sendOtpEmail(normalizedEmail, newOtp, purpose);
    }

    public void validateOtp(String email, String inputOtp) {
        // Normalize email and trim input OTP to be resilient against casing and whitespace
        String normalizedEmail = email.trim().toLowerCase();
        String cleanedOtp = inputOtp != null ? inputOtp.trim() : "";

        OtpDetails details = otpCache.getIfPresent(normalizedEmail);

        if (details == null) {
            throw new IllegalArgumentException("OTP expired or not requested. Please request a new one.");
        }

        if (details.getAttempts() >= 3) {
            otpCache.invalidate(normalizedEmail);
            throw new IllegalArgumentException("Too many invalid attempts. Your OTP has been revoked. Please request a new one.");
        }

        if (!details.getOtp().equals(cleanedOtp)) {
            details.incrementAttempts();
            otpCache.put(normalizedEmail, details);
            throw new IllegalArgumentException("Invalid OTP. Attempts left: " + (3 - details.getAttempts()));
        }

        // If success, destroy the OTP out of the cache to prevent reuse attacks
        otpCache.invalidate(normalizedEmail);
    }
}
