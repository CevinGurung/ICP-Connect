package com.icpconnect.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

public record ConversationDTO(
    Long id,
    boolean isGroup,
    String name,
    List<MemberDTO> members,
    MessageDTO lastMessage,
    LocalDateTime lastMessageAt
) {
    public record MemberDTO(
        Long userId,
        String fullName,
        String userName,
        String profileImageUrl,
        String role
    ) {}
}
