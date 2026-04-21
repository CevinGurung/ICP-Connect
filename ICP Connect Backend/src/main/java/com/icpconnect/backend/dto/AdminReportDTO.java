package com.icpconnect.backend.dto;

import java.time.LocalDateTime;

public record AdminReportDTO(
    Long id,
    Long postId,
    String postContent,
    String postAuthorName,
    String postAuthorEmail,
    Long postAuthorId,
    String postAuthorPic,
    String reportedByName,
    String reportedByEmail,
    Long reportedById,
    String reportedByPic,
    String reason,
    String status,
    LocalDateTime createdAt
) {}
