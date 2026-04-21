package com.icpconnect.backend.dto;

import java.util.List;
import java.util.Map;

public record AdminAnalyticsDTO(
    List<Map<String, Object>> postsPerDay,
    List<Map<String, Object>> donationsPerDay,
    Map<String, Long> usersByRole
) {}
