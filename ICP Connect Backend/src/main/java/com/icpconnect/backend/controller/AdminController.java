package com.icpconnect.backend.controller;

import com.icpconnect.backend.dto.*;
import com.icpconnect.backend.security.SecurityUser;
import com.icpconnect.backend.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    // ─── DASHBOARD ───
    @GetMapping("/dashboard")
    public ResponseEntity<AdminDashboardDTO> getDashboard() {
        return ResponseEntity.ok(adminService.getDashboardStats());
    }

    // ─── USERS ───
    @GetMapping("/users")
    public ResponseEntity<Page<AdminUserDTO>> getUsers(
            @RequestParam(defaultValue = "") String role,
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "0") int page) {
        return ResponseEntity.ok(adminService.getUsers(role, search, page));
    }

    @PatchMapping("/users/{id}/role")
    public ResponseEntity<Map<String, String>> updateUserRole(
            @PathVariable Long id,
            @RequestParam String role,
            @AuthenticationPrincipal SecurityUser principal) {
        adminService.updateUserRole(id, role, principal.getUser());
        return ResponseEntity.ok(Map.of("message", "Role updated to " + role));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Map<String, String>> deleteUser(
            @PathVariable Long id,
            @AuthenticationPrincipal SecurityUser principal) {
        adminService.softDeleteUser(id, principal.getUser());
        return ResponseEntity.ok(Map.of("message", "User deactivated"));
    }

    // ─── POSTS ───
    @GetMapping("/posts")
    public ResponseEntity<Page<AdminPostDTO>> getPosts(
            @RequestParam(defaultValue = "0") int page) {
        return ResponseEntity.ok(adminService.getAllPosts(page));
    }

    @DeleteMapping("/posts/{id}")
    public ResponseEntity<Map<String, String>> deletePost(@PathVariable Long id) {
        adminService.adminDeletePost(id);
        return ResponseEntity.ok(Map.of("message", "Post deleted"));
    }

    // ─── REPORTS ───
    @GetMapping("/reports")
    public ResponseEntity<Page<AdminReportDTO>> getReports(
            @RequestParam(defaultValue = "ALL") String status,
            @RequestParam(defaultValue = "0") int page) {
        return ResponseEntity.ok(adminService.getReports(status, page));
    }

    @PatchMapping("/reports/{id}/resolve")
    public ResponseEntity<Map<String, String>> resolveReport(
            @PathVariable Long id,
            @RequestParam String action) {
        adminService.resolveReport(id, action);
        return ResponseEntity.ok(Map.of("message", "Report marked as " + action));
    }

    @DeleteMapping("/reports/{id}/delete-post")
    public ResponseEntity<Map<String, String>> deleteReportedPost(@PathVariable Long id) {
        adminService.deleteReportedPost(id);
        return ResponseEntity.ok(Map.of("message", "Post deleted and report resolved"));
    }

    // ─── DONATIONS ───
    @GetMapping("/donations")
    public ResponseEntity<Page<AdminDonationDTO>> getDonations(
            @RequestParam(defaultValue = "0") int page) {
        return ResponseEntity.ok(adminService.getDonations(page));
    }

    // ─── ACTIVITY FEED ───
    @GetMapping("/activity")
    public ResponseEntity<List<ActivityDTO>> getActivity() {
        return ResponseEntity.ok(adminService.getActivityFeed());
    }

    // ─── ANALYTICS ───
    @GetMapping("/analytics")
    public ResponseEntity<AdminAnalyticsDTO> getAnalytics() {
        return ResponseEntity.ok(adminService.getAnalytics());
    }
}
