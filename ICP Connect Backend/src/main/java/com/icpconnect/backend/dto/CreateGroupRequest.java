package com.icpconnect.backend.dto;

import java.util.List;

public record CreateGroupRequest(
    String name,
    List<Long> memberIds
) {}
