package com.icpconnect.backend.service;

import com.icpconnect.backend.dto.*;
import com.icpconnect.backend.entity.*;
import com.icpconnect.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final PostReportRepository postReportRepository;
    private final DonationRepository donationRepository;
    private final CommentRepository commentRepository;

    // ─────────────── DASHBOARD ───────────────

    public AdminDashboardDTO getDashboardStats() {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();

        long totalUsers = userRepository.countByIsActiveTrue();
        long totalStudents = userRepository.countByRoleAndIsActiveTrue(Role.STUDENT);
        long totalTeachers = userRepository.countByRoleAndIsActiveTrue(Role.TEACHER);
        long totalAdmins = userRepository.countByRoleAndIsActiveTrue(Role.ADMIN);
        long totalPosts = postRepository.countByIsDeletedFalse(); // already filtered in repository
        long totalComments = commentRepository.countByIsDeletedFalse();
        long totalReports = postReportRepository.count();
        long pendingReports = postReportRepository.countByStatus("PENDING");
        long totalDonations = donationRepository.countByStatus("COMPLETED");
        BigDecimal totalDonationAmount = donationRepository.sumCompletedDonations();
        long newUsersToday = userRepository.countByCreatedAtAfterAndIsActiveTrue(startOfDay);
        long newPostsToday = postRepository.countByCreatedAtAfter(startOfDay);

        return new AdminDashboardDTO(
            totalUsers, totalStudents, totalTeachers, totalAdmins,
            totalPosts, totalComments, totalReports, pendingReports,
            totalDonations, totalDonationAmount, newUsersToday, newPostsToday
        );
    }

    // ─────────────── USERS ───────────────

    public Page<AdminUserDTO> getUsers(String roleStr, String search, int page) {
        Role role = null;
        if (roleStr != null && !roleStr.isBlank() && !roleStr.equalsIgnoreCase("ALL")) {
            try { role = Role.valueOf(roleStr.toUpperCase()); } catch (IllegalArgumentException ignored) {}
        }
        String searchParam = (search != null && !search.isBlank()) ? "%" + search.toLowerCase() + "%" : null;

        Page<User> users = userRepository.findByRoleAndSearch(
            role, searchParam,
            PageRequest.of(page, 20, Sort.by("createdAt").descending())
        );

        return users.map(u -> new AdminUserDTO(
            u.getId(), u.getFullName(), u.getUserName(), u.getEmail(),
            u.getRole().name(), u.getProgram(), u.getYear(), u.getSection(),
            u.getSubject(), u.getSpecialty(), u.getProfileImageUrl(),
            u.isActive(), postRepository.countByUserIdAndIsDeletedFalse(u.getId()),
            u.getCreatedAt()
        ));
    }

    @Transactional
    public void updateUserRole(Long targetId, String newRoleStr, User admin) {
        User target = userRepository.findById(targetId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (target.getRole() == Role.ADMIN) {
            throw new IllegalArgumentException("Cannot change role of another admin");
        }
        if (target.getId().equals(admin.getId())) {
            throw new IllegalArgumentException("Cannot change your own role");
        }

        Role newRole;
        try { newRole = Role.valueOf(newRoleStr.toUpperCase()); }
        catch (IllegalArgumentException e) { throw new IllegalArgumentException("Invalid role: " + newRoleStr); }

        target.setRole(newRole);
        userRepository.save(target);
    }

    @Transactional
    public void softDeleteUser(Long targetId, User admin) {
        User target = userRepository.findById(targetId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (target.getRole() == Role.ADMIN) {
            throw new IllegalArgumentException("Cannot delete another admin");
        }
        if (target.getId().equals(admin.getId())) {
            throw new IllegalArgumentException("Cannot delete yourself");
        }

        target.setActive(false);
        userRepository.save(target);
    }

    // ─────────────── POSTS ───────────────

    public Page<AdminPostDTO> getAllPosts(int page) {
        Page<Post> posts = postRepository.findAllActivePostsPaged(
            PageRequest.of(page, 20, Sort.by("createdAt").descending())
        );
        return posts.map(this::toAdminPostDTO);
    }

    @Transactional
    public void adminDeletePost(Long postId) {
        Post post = postRepository.findById(postId)
            .orElseThrow(() -> new IllegalArgumentException("Post not found"));
        post.setDeleted(true);
        postRepository.save(post);
    }

    // ─────────────── REPORTS ───────────────

    public Page<AdminReportDTO> getReports(String status, int page) {
        String statusParam = (status != null && !status.isBlank() && !status.equalsIgnoreCase("ALL")) ? status.toUpperCase() : null;
        Page<PostReport> reports = postReportRepository.findByStatusOrAll(
            statusParam, PageRequest.of(page, 20, Sort.by("createdAt").descending())
        );
        return reports.map(this::toAdminReportDTO);
    }

    @Transactional
    public void resolveReport(Long reportId, String action) {
        PostReport report = postReportRepository.findById(reportId)
            .orElseThrow(() -> new IllegalArgumentException("Report not found"));

        String upperAction = action.toUpperCase();
        if (!upperAction.equals("RESOLVED") && !upperAction.equals("IGNORED")) {
            throw new IllegalArgumentException("Action must be RESOLVED or IGNORED");
        }
        report.setStatus(upperAction);
        postReportRepository.save(report);
    }

    @Transactional
    public void deleteReportedPost(Long reportId) {
        PostReport report = postReportRepository.findById(reportId)
            .orElseThrow(() -> new IllegalArgumentException("Report not found"));

        Post post = report.getPost();
        if (post != null && !post.isDeleted()) {
            post.setDeleted(true);
            postRepository.save(post);
        }

        report.setStatus("RESOLVED");
        postReportRepository.save(report);
    }

    // ─────────────── DONATIONS ───────────────

    public Page<AdminDonationDTO> getDonations(int page) {
        Page<Donation> donations = donationRepository.findByStatusOrderByCreatedAtDesc(
            "COMPLETED", PageRequest.of(page, 20)
        );
        return donations.map(d -> new AdminDonationDTO(
            d.getId(),
            d.getDonor() != null ? d.getDonor().getFullName() : "Unknown",
            d.getDonor() != null ? d.getDonor().getEmail() : "",
            d.getDonor() != null ? d.getDonor().getProfileImageUrl() : null,
            d.getAmount(),
            d.getMessage(),
            d.getStatus(),
            d.getPaymentMethod(),
            d.getCreatedAt()
        ));
    }

    // ─────────────── ACTIVITY FEED ───────────────

    public List<ActivityDTO> getActivityFeed() {
        List<ActivityDTO> activities = new ArrayList<>();

        // Recent reports
        postReportRepository.findByStatusOrAll(null, PageRequest.of(0, 20)).forEach(r -> {
            String actorName = r.getReporter() != null ? r.getReporter().getFullName() : "Unknown";
            String actorEmail = r.getReporter() != null ? r.getReporter().getEmail() : "";
            String actorPic = r.getReporter() != null ? r.getReporter().getProfileImageUrl() : null;
            String desc = actorName + " reported a post: \"" + truncate(r.getReason(), 60) + "\"";
            activities.add(new ActivityDTO("REPORT", actorName, actorEmail, actorPic, desc, r.getCreatedAt()));
        });

        // Recent joins
        userRepository.findAll(PageRequest.of(0, 20, Sort.by("createdAt").descending())).forEach(u -> {
            String desc = u.getFullName() + " (" + u.getRole().name() + ") joined ICP Connect";
            activities.add(new ActivityDTO("JOIN", u.getFullName(), u.getEmail(), u.getProfileImageUrl(), desc, u.getCreatedAt()));
        });

        // Recent completed donations
        donationRepository.findByStatusOrderByCreatedAtDesc("COMPLETED", PageRequest.of(0, 20)).forEach(d -> {
            String name = d.getDonor() != null ? d.getDonor().getFullName() : "Anonymous";
            String email = d.getDonor() != null ? d.getDonor().getEmail() : "";
            String pic = d.getDonor() != null ? d.getDonor().getProfileImageUrl() : null;
            String desc = name + " donated Rs." + d.getAmount() + (d.getMessage() != null ? ": " + truncate(d.getMessage(), 50) : "");
            activities.add(new ActivityDTO("DONATION", name, email, pic, desc, d.getCreatedAt()));
        });

        // Sort all by timestamp desc, limit to 50
        activities.sort(Comparator.comparing(ActivityDTO::timestamp, Comparator.reverseOrder()));
        return activities.stream().limit(50).collect(Collectors.toList());
    }

    // ─────────────── ANALYTICS ───────────────

    public AdminAnalyticsDTO getAnalytics() {
        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);

        // Posts per day
        List<Map<String, Object>> postsPerDay = postRepository.countPostsPerDay(sevenDaysAgo)
            .stream().map(row -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("day", row[0].toString());
                m.put("count", ((Number) row[1]).longValue());
                return m;
            }).collect(Collectors.toList());

        // Donations per day
        List<Map<String, Object>> donationsPerDay = donationRepository.countDonationsPerDay(sevenDaysAgo)
            .stream().map(row -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("day", row[0].toString());
                m.put("count", ((Number) row[1]).longValue());
                m.put("total", row[2]);
                return m;
            }).collect(Collectors.toList());

        // Users by role
        Map<String, Long> usersByRole = new LinkedHashMap<>();
        usersByRole.put("STUDENT", userRepository.countByRole(Role.STUDENT));
        usersByRole.put("TEACHER", userRepository.countByRole(Role.TEACHER));
        usersByRole.put("ADMIN", userRepository.countByRole(Role.ADMIN));

        return new AdminAnalyticsDTO(postsPerDay, donationsPerDay, usersByRole);
    }

    // ─────────────── HELPERS ───────────────

    private AdminPostDTO toAdminPostDTO(Post p) {
        return new AdminPostDTO(
            p.getId(),
            p.getContent(),
            p.getUser() != null ? p.getUser().getFullName() : "Unknown",
            p.getUser() != null ? p.getUser().getEmail() : "",
            p.getUser() != null ? p.getUser().getId() : null,
            p.getUser() != null ? p.getUser().getProfileImageUrl() : null,
            p.getLikeCount(),
            p.getCommentCount(),
            p.getMedia() != null ? p.getMedia().size() : 0,
            p.getShareCount() != null ? p.getShareCount() : 0,
            p.getCreatedAt()
        );
    }

    private AdminReportDTO toAdminReportDTO(PostReport r) {
        Post post = r.getPost();
        User reporter = r.getReporter();
        return new AdminReportDTO(
            r.getId(),
            post != null ? post.getId() : null,
            post != null ? truncate(post.getContent(), 120) : "[deleted]",
            post != null && post.getUser() != null ? post.getUser().getFullName() : "Unknown",
            post != null && post.getUser() != null ? post.getUser().getEmail() : "",
            post != null && post.getUser() != null ? post.getUser().getId() : null,
            post != null && post.getUser() != null ? post.getUser().getProfileImageUrl() : null,
            reporter != null ? reporter.getFullName() : "Unknown",
            reporter != null ? reporter.getEmail() : "",
            reporter != null ? reporter.getId() : null,
            reporter != null ? reporter.getProfileImageUrl() : null,
            r.getReason(),
            r.getStatus(),
            r.getCreatedAt()
        );
    }

    private String truncate(String s, int max) {
        if (s == null) return "";
        return s.length() <= max ? s : s.substring(0, max) + "…";
    }
}
