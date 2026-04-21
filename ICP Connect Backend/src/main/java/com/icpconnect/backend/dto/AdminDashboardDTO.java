package com.icpconnect.backend.dto;

import java.math.BigDecimal;

public record AdminDashboardDTO(
    long totalUsers,
    long totalStudents,
    long totalTeachers,
    long totalAdmins,
    long totalPosts,
    long totalComments,
    long totalReports,
    long pendingReports,
    long totalDonations,
    BigDecimal totalDonationAmount,
    long newUsersToday,
    long newPostsToday
) {}
