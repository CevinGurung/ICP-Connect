package com.icpconnect.backend.dto;

import java.time.LocalDateTime;

public record ActivityDTO(
    String type,         // REPORT, JOIN, DONATION
    String actorName,
    String actorEmail,
    String actorPic,
    String description,
    LocalDateTime timestamp
) {}
