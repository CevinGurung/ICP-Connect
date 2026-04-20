package com.icpconnect.backend.dto;

import java.time.LocalDateTime;

public record MessageDTO(
    Long id,
    Long conversationId,
    Long senderId,
    String senderName,
    String senderAvatar,
    String content,
    String messageType,
    String mediaUrl,
    LocalDateTime createdAt
) {}
