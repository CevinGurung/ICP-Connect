package com.icpconnect.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CommentRequest(
    @NotBlank(message = "Comment content cannot be empty")
    @Size(max = 1000, message = "Comment must be less than 1000 characters")
    String content
) {}
