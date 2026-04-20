package com.icpconnect.backend.dto;

import java.math.BigDecimal;

public record DonationRequest(
    BigDecimal amount,
    String message
) {}
