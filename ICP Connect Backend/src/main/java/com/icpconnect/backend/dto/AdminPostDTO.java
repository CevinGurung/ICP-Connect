package com.icpconnect.backend.dto;

import java.time.LocalDateTime;

public record AdminPostDTO(
    Long id,
    String content,
    String authorName,
    String authorEmail,
    Long authorId,
    String authorProfilePic,
    int likeCount,
    int commentCount,
    int mediaCount,
    int shareCount,
    LocalDateTime createdAt
) {}
