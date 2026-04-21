package com.icpconnect.backend.controller;

import com.icpconnect.backend.dto.UserProfileDTO;
import com.icpconnect.backend.entity.User;
import com.icpconnect.backend.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/{id}/profile")
    public ResponseEntity<UserProfileDTO> getUserProfile(
            @PathVariable Long id,
            @AuthenticationPrincipal com.icpconnect.backend.security.SecurityUser principal) {
        User currentUser = (principal != null) ? principal.getUser() : null;
        return ResponseEntity.ok(userService.getUserProfile(id, currentUser));
    }

    @PostMapping("/{id}/follow")
    public ResponseEntity<java.util.Map<String, Boolean>> toggleFollow(
            @PathVariable Long id,
            @AuthenticationPrincipal com.icpconnect.backend.security.SecurityUser principal) {
        boolean isFollowing = userService.toggleFollow(id, principal.getUser());
        return ResponseEntity.ok(java.util.Map.of("isFollowing", isFollowing));
    }

    @PutMapping("/profile")
    public ResponseEntity<Void> updateProfile(
            @AuthenticationPrincipal com.icpconnect.backend.security.SecurityUser principal,
            @RequestParam("fullName") String fullName,
            @RequestParam("bio") String bio,
            @RequestParam("program") String program,
            @RequestParam("year") String year,
            @RequestParam("section") String section,
            @RequestParam(value = "removeProfilePic", defaultValue = "false") boolean removeProfilePic,
            @RequestPart(value = "profilePic", required = false) org.springframework.web.multipart.MultipartFile profilePic) {
        userService.updateProfile(principal.getUser(), fullName, bio, program, year, section, profilePic, removeProfilePic);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{userId}/followers")
    public ResponseEntity<java.util.List<com.icpconnect.backend.dto.UserSummaryDTO>> getFollowers(
            @PathVariable Long userId,
            @AuthenticationPrincipal com.icpconnect.backend.security.SecurityUser principal) {
        User currentUser = (principal != null) ? principal.getUser() : null;
        return ResponseEntity.ok(userService.getUserFollowers(userId, currentUser));
    }

    @GetMapping("/{userId}/following")
    public ResponseEntity<java.util.List<com.icpconnect.backend.dto.UserSummaryDTO>> getFollowing(
            @PathVariable Long userId,
            @AuthenticationPrincipal com.icpconnect.backend.security.SecurityUser principal) {
        User currentUser = (principal != null) ? principal.getUser() : null;
        return ResponseEntity.ok(userService.getUserFollowing(userId, currentUser));
    }

    @GetMapping("/recommendations")
    public ResponseEntity<java.util.List<com.icpconnect.backend.dto.UserSummaryDTO>> getRecommendations(
            @AuthenticationPrincipal com.icpconnect.backend.security.SecurityUser principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "9") int size) {
        return ResponseEntity.ok(userService.getRecommendedUsers(principal.getUser(), page, size));
    }

    @GetMapping("/connections")
    public ResponseEntity<java.util.List<com.icpconnect.backend.dto.UserSummaryDTO>> getMutualConnections(
            @AuthenticationPrincipal com.icpconnect.backend.security.SecurityUser principal) {
        return ResponseEntity.ok(userService.getMutualConnections(principal.getUser()));
    }
}
