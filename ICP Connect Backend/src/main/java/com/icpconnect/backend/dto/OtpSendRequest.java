package com.icpconnect.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record OtpSendRequest(
        @NotBlank 
        @Email 
        @Pattern(regexp = ".*@icp\\.edu\\.np$", message = "Email must be an @icp.edu.np domain")
        String email
) {}
