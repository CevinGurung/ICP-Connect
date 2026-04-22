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
    // LEARNING NOTE: We use a 'Cache' here to remember the OTP code for 5 minutes. 
    // It's much faster than saving it to a database because it stays in the server's RAM!
    private final Cache<String, OtpDetails> otpCache = Caffeine.newBuilder()
            .expireAfterWrite(5, TimeUnit.MINUTES)
            .maximumSize(10000)
            .build();

    private final EmailService emailService;

    public OtpService(EmailService emailService) {
        this.emailService = emailService;
    }

    // LEARNING NOTE: Step 1 - Generate a random 6-digit number and send it to the email.
    public void generateAndSendOtp(String email, String purpose) {
        // Normalize email to prevent case-sensitive cache misses
        String normalizedEmail = email.trim().toLowerCase();
        
        OtpDetails existing = otpCache.getIfPresent(normalizedEmail);

        if (existing != null) {
            long secondsSinceLast = java.time.Duration.between(existing.getLastSentAt(), LocalDateTime.now()).getSeconds();
            // LEARNING NOTE: This is a 'Wait Timer' to prevent people from spamming our 
            // email server. You have to wait at least 30 seconds before asking for another code.
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

    // LEARNING NOTE: Step 2 - Check if the user entered the EXACT same number we sent.
    // If they fail 3 times, we delete the code so they can't keep guessing!
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
