package com.icpconnect.backend.dto;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        boolean otpRequired
) {}
