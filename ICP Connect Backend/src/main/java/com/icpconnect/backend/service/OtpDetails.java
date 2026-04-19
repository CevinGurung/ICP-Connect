package com.icpconnect.backend.service;

import java.time.LocalDateTime;

public class OtpDetails {
    private String otp;
    private int attempts;
    private LocalDateTime lastSentAt;

    public OtpDetails(String otp, LocalDateTime lastSentAt) {
        this.otp = otp;
        this.attempts = 0;
        this.lastSentAt = lastSentAt;
    }

    public String getOtp() { return otp; }
    public void setOtp(String otp) { this.otp = otp; }
    
    public int getAttempts() { return attempts; }
    public void incrementAttempts() { this.attempts++; }
    
    public LocalDateTime getLastSentAt() { return lastSentAt; }
    public void setLastSentAt(LocalDateTime lastSentAt) { this.lastSentAt = lastSentAt; }
}
