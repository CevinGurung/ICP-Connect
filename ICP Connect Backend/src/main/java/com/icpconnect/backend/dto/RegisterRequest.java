package com.icpconnect.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank @Size(min = 2, max = 100) String fullName,
        @NotBlank @Size(min = 4, max = 50) String userName,
        @Email @NotBlank @Pattern(regexp = ".*@icp\\.edu\\.np$", message = "Email must be an @icp.edu.np domain") String email,
        @NotBlank @Size(min = 6, max = 100) String password,
        @NotBlank String program,
        @NotBlank String year,
        String section,
        @NotBlank @Size(min = 6, max = 6, message = "OTP must be exactly 6 digits") String otp
) {}
