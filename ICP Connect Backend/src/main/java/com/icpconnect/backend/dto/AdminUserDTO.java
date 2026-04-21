package com.icpconnect.backend.dto;

import java.time.LocalDateTime;

public record AdminUserDTO(
    Long id,
    String fullName,
    String userName,
    String email,
    String role,
    String program,
    String year,
    String section,
    String subject,
    String specialty,
    String profilePicUrl,
    boolean isActive,
    long postCount,
    LocalDateTime createdAt
) {}
