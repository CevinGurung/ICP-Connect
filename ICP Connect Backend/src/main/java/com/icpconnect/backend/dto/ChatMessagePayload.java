package com.icpconnect.backend.dto;

public record ChatMessagePayload(
    String content,
    String messageType
) {}
