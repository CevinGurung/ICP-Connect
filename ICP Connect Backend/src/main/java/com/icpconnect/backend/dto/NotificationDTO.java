package com.icpconnect.backend.dto;

import java.time.LocalDateTime;

public record NotificationDTO(
    Long id,
    Long userId,
    Long actorId,
    String actorName,
    String actorProfileImageUrl,
    String type,
    Long postId,
    Long commentId,
    String message,
    boolean isRead,
    LocalDateTime createdAt,
    boolean isFollowing,
    boolean isFollowedBy
) {}
