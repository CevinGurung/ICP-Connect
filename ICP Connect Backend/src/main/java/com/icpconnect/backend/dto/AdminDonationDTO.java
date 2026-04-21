package com.icpconnect.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record AdminDonationDTO(
    Long id,
    String donorName,
    String donorEmail,
    String donorPic,
    BigDecimal amount,
    String message,
    String status,
    String paymentMethod,
    LocalDateTime createdAt
) {}
