package com.icpconnect.backend.dto;

public record UserSummaryDTO(
    Long id,
    String fullName,
    String userName,
    String profileImageUrl,
    boolean isFollowing,
    boolean isFollowedBy,
    boolean isOwnProfile,
    String bio,
    String program,
    String year,
    String section
) {}
