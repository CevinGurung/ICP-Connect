package com.icpconnect.backend.service;

import com.icpconnect.backend.dto.UserProfileDTO;
import com.icpconnect.backend.entity.Follow;
import com.icpconnect.backend.entity.NotificationType;
import com.icpconnect.backend.entity.User;
import com.icpconnect.backend.repository.FollowRepository;
import com.icpconnect.backend.repository.PostRepository;
import com.icpconnect.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final FollowRepository followRepository;
    private final PostRepository postRepository;
    private final NotificationService notificationService;
    private final java.nio.file.Path avatarRoot = java.nio.file.Paths.get("uploads/avatars");

    public UserService(UserRepository userRepository, FollowRepository followRepository,
                       PostRepository postRepository, NotificationService notificationService) {
        this.userRepository = userRepository;
        this.followRepository = followRepository;
        this.postRepository = postRepository;
        this.notificationService = notificationService;
    }

    @jakarta.annotation.PostConstruct
    public void init() {
        try {
            java.nio.file.Files.createDirectories(avatarRoot);
        } catch (java.io.IOException e) {
            throw new RuntimeException("Could not initialize storage for avatars!");
        }
    }

    public UserProfileDTO getUserProfile(Long userId, User currentUser) {
        User targetUser = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!targetUser.isActive()) {
            throw new IllegalArgumentException("This account has been deactivated.");
        }

        long postCount = postRepository.countByUserIdAndIsDeletedFalse(userId);
        long followersCount = followRepository.countByFollowingIdAndFollowerIsActiveTrue(userId);
        long followingCount = followRepository.countByFollowerIdAndFollowingIsActiveTrue(userId);

        boolean isFollowing = false;
        boolean isFollowedBy = false;
        boolean isOwnProfile = false;

        if (currentUser != null) {
            isFollowing = followRepository.existsByFollowerIdAndFollowingId(currentUser.getId(), userId);
            isFollowedBy = followRepository.existsByFollowerIdAndFollowingId(userId, currentUser.getId());
            isOwnProfile = currentUser.getId().equals(userId);
        }

        return new UserProfileDTO(
                targetUser.getId(),
                targetUser.getFullName(),
                targetUser.getUserName(),
                targetUser.getBio(),
                targetUser.getProgram(),
                targetUser.getYear(),
                targetUser.getSection(),
                targetUser.getProfileImageUrl(),
                targetUser.getRole().name(),
                targetUser.getSubject(),
                targetUser.getSpecialty(),
                postCount,
                followersCount,
                followingCount,
                isFollowing,
                isFollowedBy,
                isOwnProfile
        );
    }

    @Transactional
    public boolean toggleFollow(Long targetUserId, User currentUser) {
        if (currentUser.getId().equals(targetUserId)) {
            throw new IllegalArgumentException("You cannot follow yourself.");
        }

        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("Target user not found"));

        try {
            var followOpt = followRepository.findByFollowerAndFollowing(currentUser, targetUser);
            if (followOpt.isPresent()) {
                followRepository.delete(followOpt.get());
                return false;
            } else {
                Follow follow = new Follow();
                follow.setFollower(currentUser);
                follow.setFollowing(targetUser);
                followRepository.save(follow);

                // Fire FOLLOW notification
                notificationService.createNotification(
                        targetUser, currentUser, NotificationType.FOLLOW,
                        null, null,
                        currentUser.getFullName() + " started following you"
                );

                // Check if mutual follow → FOLLOW_BACK for BOTH users
                if (followRepository.existsByFollowerIdAndFollowingId(
                        targetUser.getId(), currentUser.getId())) {
                    notificationService.createNotification(
                            targetUser, currentUser, NotificationType.FOLLOW_BACK,
                            null, null,
                            "You and " + currentUser.getFullName() + " are now connected"
                    );
                    notificationService.createNotification(
                            currentUser, targetUser, NotificationType.FOLLOW_BACK,
                            null, null,
                            "You and " + targetUser.getFullName() + " are now connected"
                    );
                }
                return true;
            }
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            return true; // Assume followed if constraint hit
        }
    }

    @Transactional
    public void updateProfile(User currentUser, String fullName, String bio, String program, String year, String section, org.springframework.web.multipart.MultipartFile profilePic, boolean removeProfilePic) {
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        user.setFullName(fullName);
        user.setBio(bio);
        user.setProgram(program);
        user.setYear(year);
        user.setSection(section);

        // Handle explicit removal or replacement
        if (removeProfilePic || (profilePic != null && !profilePic.isEmpty())) {
            if (user.getProfileImageUrl() != null) {
                try {
                    String oldFileName = user.getProfileImageUrl().substring(user.getProfileImageUrl().lastIndexOf("/") + 1);
                    java.nio.file.Files.deleteIfExists(this.avatarRoot.resolve(oldFileName));
                } catch (java.io.IOException e) {
                }
            }
            user.setProfileImageUrl(null);
        }

        if (profilePic != null && !profilePic.isEmpty()) {
            String fileName = java.util.UUID.randomUUID() + "_" + profilePic.getOriginalFilename();
            try {
                java.nio.file.Files.copy(profilePic.getInputStream(), this.avatarRoot.resolve(fileName), java.nio.file.StandardCopyOption.REPLACE_EXISTING);
                user.setProfileImageUrl("/uploads/avatars/" + fileName);
            } catch (java.io.IOException e) {
                throw new RuntimeException("Could not store avatar file!");
            }
        }
        
        userRepository.save(user);
    }

    public java.util.List<com.icpconnect.backend.dto.UserSummaryDTO> getUserFollowers(Long userId, User currentUser) {
        return followRepository.findByFollowingId(userId).stream()
                .filter(f -> f.getFollower().isActive())
                .map(f -> mapToSummary(f.getFollower(), currentUser))
                .toList();
    }

    public java.util.List<com.icpconnect.backend.dto.UserSummaryDTO> getUserFollowing(Long userId, User currentUser) {
        return followRepository.findByFollowerId(userId).stream()
                .filter(f -> f.getFollowing().isActive())
                .map(f -> mapToSummary(f.getFollowing(), currentUser))
                .toList();
    }

    public java.util.List<com.icpconnect.backend.dto.UserSummaryDTO> getRecommendedUsers(User currentUser, int page, int size) {
        if (currentUser == null) return java.util.Collections.emptyList();

        java.util.Set<Long> followingIds = followRepository.findByFollowerId(currentUser.getId())
                .stream()
                .map(f -> f.getFollowing().getId())
                .collect(java.util.stream.Collectors.toSet());
        followingIds.add(currentUser.getId()); // Exclude self

        java.util.List<User> allMatches = new java.util.ArrayList<>();
        java.util.Set<Long> addedIds = new java.util.HashSet<>();

        // Tier 1: Same Academic Context (Program + Year + Section)
        if (currentUser.getProgram() != null && currentUser.getYear() != null && currentUser.getSection() != null) {
            userRepository.findByProgramAndYearAndSectionAndIdNot(
                currentUser.getProgram(), currentUser.getYear(), currentUser.getSection(), currentUser.getId())
                .stream()
                .filter(u -> u.isActive() && !followingIds.contains(u.getId()))
                .forEach(u -> {
                    if (addedIds.add(u.getId())) allMatches.add(u);
                });
        }

        // Tier 2: Same Program (Fallback)
        if (currentUser.getProgram() != null) {
            userRepository.findByProgramAndIdNot(currentUser.getProgram(), currentUser.getId())
                .stream()
                .filter(u -> u.isActive() && !followingIds.contains(u.getId()))
                .forEach(u -> {
                    if (addedIds.add(u.getId())) allMatches.add(u);
                });
        }

        // Tier 3: Random Users (Last Fallback - fetch enough to fill potential pages)
        int randomLimit = 100; 
        userRepository.findRandomUsers(currentUser.getId(), randomLimit)
            .stream()
            .filter(u -> u.isActive() && !followingIds.contains(u.getId()))
            .forEach(u -> {
                if (addedIds.add(u.getId())) allMatches.add(u);
            });

        // Pagination
        int start = page * size;
        if (start >= allMatches.size()) return java.util.Collections.emptyList();
        int end = Math.min(start + size, allMatches.size());

        return allMatches.subList(start, end).stream()
                .map(u -> mapToSummary(u, currentUser))
                .toList();
    }

    private com.icpconnect.backend.dto.UserSummaryDTO mapToSummary(User user, User currentUser) {
        boolean isFollowing = currentUser != null && followRepository.existsByFollowerIdAndFollowingId(currentUser.getId(), user.getId());
        boolean isFollowedBy = currentUser != null && followRepository.existsByFollowerIdAndFollowingId(user.getId(), currentUser.getId());
        boolean isOwnProfile = currentUser != null && currentUser.getId().equals(user.getId());
        return new com.icpconnect.backend.dto.UserSummaryDTO(
                user.getId(),
                user.getFullName(),
                user.getUserName(),
                user.getProfileImageUrl(),
                isFollowing,
                isFollowedBy,
                isOwnProfile,
                user.getBio(),
                user.getProgram(),
                user.getYear(),
                user.getSection(),
                user.getRole() != null ? user.getRole().name() : null,
                user.getSubject(),
                user.getSpecialty()
        );
    }

    public java.util.List<com.icpconnect.backend.dto.UserSummaryDTO> getMutualConnections(User currentUser) {
        // Get users I follow
        java.util.List<Follow> myFollowing = followRepository.findByFollowerId(currentUser.getId());
        
        return myFollowing.stream()
                .filter(f -> f.getFollowing().isActive() && followRepository.existsByFollowerIdAndFollowingId(
                        f.getFollowing().getId(), currentUser.getId())) // they also follow me and are active
                .map(f -> mapToSummary(f.getFollowing(), currentUser))
                .toList();
    }
}
