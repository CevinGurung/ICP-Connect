package com.icpconnect.backend.dto;

public record UserProfileDTO(
    Long id,
    String fullName,
    String userName,
    String bio,
    String program,
    String year,
    String section,
    String profilePicUrl,
    String role,
    String subject,
    String specialty,
    long postCount,
    long followersCount,
    long followingCount,
    boolean isFollowing,
    boolean isFollowedBy,
    boolean isOwnProfile
) {}
