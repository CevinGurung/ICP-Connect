package com.icpconnect.backend.controller;

import com.icpconnect.backend.dto.LikedUserDTO;
import com.icpconnect.backend.entity.Post;
import com.icpconnect.backend.entity.User;
import com.icpconnect.backend.service.PostService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
// LEARNING NOTE: PostController handles everything you see on the 'Home Feed'. 
// It is the middleman between the User's screen and our Post database.
@RequestMapping("/api/posts")
public class PostController {

    private final PostService postService;
    
    public PostController(PostService postService) {
        this.postService = postService;
    }

    @PostMapping("/create")
    // LEARNING NOTE: This is how a user shares a new post. 
    // It accepts text (content) and optional files (images or video).
    public ResponseEntity<Post> createPost(
            @RequestParam("content") String content,
            @RequestParam(value = "files", required = false) MultipartFile[] files,
            @AuthenticationPrincipal com.icpconnect.backend.security.SecurityUser principal
    ) {
        Post post = postService.createPost(principal.getUser().getId(), content, files);
        return ResponseEntity.ok(post);
    }
    @GetMapping("/feed")
    // LEARNING NOTE: This is called by the Frontend to load the main scrolling feed.
    public ResponseEntity<List<Post>> getFeed(@AuthenticationPrincipal com.icpconnect.backend.security.SecurityUser principal) {
        Long userId = (principal != null) ? principal.getUser().getId() : null;
        List<Post> feed = postService.getFeed(userId);
        return ResponseEntity.ok(feed);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Post>> getUserPosts(
            @PathVariable Long userId,
            @AuthenticationPrincipal com.icpconnect.backend.security.SecurityUser principal) {
        Long currentUserId = (principal != null) ? principal.getUser().getId() : null;
        return ResponseEntity.ok(postService.getPostsByUserId(userId, currentUserId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Post> getPostById(@PathVariable Long id, @AuthenticationPrincipal com.icpconnect.backend.security.SecurityUser principal) {
        Long userId = (principal != null) ? principal.getUser().getId() : null;
        Post post = postService.getPostById(id, userId);
        return ResponseEntity.ok(post);
    }

    @PostMapping("/{id}/like")
    // LEARNING NOTE: This handles the 'Heart' or 'Like' button on a post.
    public ResponseEntity<Post> toggleLike(@PathVariable Long id, @AuthenticationPrincipal com.icpconnect.backend.security.SecurityUser principal) {
        Post post = postService.toggleLike(id, principal.getUser().getId());
        return ResponseEntity.ok(post);
    }

    @PostMapping("/{id}/share")
    public ResponseEntity<Void> sharePost(@PathVariable Long id) {
        postService.sharePost(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/likes")
    public ResponseEntity<Page<LikedUserDTO>> getPostLikes(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Page<LikedUserDTO> likes = postService.getPostLikes(id, PageRequest.of(page, size));
        return ResponseEntity.ok(likes);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Post> updatePost(
            @PathVariable Long id,
            @RequestParam("content") String content,
            @RequestParam(value = "files", required = false) MultipartFile[] files,
            @RequestParam(value = "removedMediaIds", required = false) List<Long> removedMediaIds,
            @AuthenticationPrincipal com.icpconnect.backend.security.SecurityUser principal
    ) {
        User user = principal.getUser();
        Post post = postService.updatePost(id, content, files, removedMediaIds, user.getId());
        return ResponseEntity.ok(post);
    }

    @DeleteMapping("/{id}")
    // LEARNING NOTE: This handles deleting your own post (or an Admin deleting an inappropriate one).
    public ResponseEntity<Void> deletePost(@PathVariable Long id, @AuthenticationPrincipal com.icpconnect.backend.security.SecurityUser principal) {
        postService.softDeletePost(id, principal.getUser());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/report")
    public ResponseEntity<java.util.Map<String, String>> reportPost(
            @PathVariable Long id,
            @RequestParam(defaultValue = "Inappropriate content") String reason,
            @AuthenticationPrincipal com.icpconnect.backend.security.SecurityUser principal) {
        postService.reportPost(id, principal.getUser(), reason);
        return ResponseEntity.ok(java.util.Map.of("message", "Post reported successfully"));
    }
}
