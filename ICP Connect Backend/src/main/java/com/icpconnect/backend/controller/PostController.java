package com.icpconnect.backend.controller;

import com.icpconnect.backend.entity.Post;
import com.icpconnect.backend.entity.User;
import com.icpconnect.backend.service.PostService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/posts")
public class PostController {

    private final PostService postService;
    
    public PostController(PostService postService) {
        this.postService = postService;
    }

    @PostMapping("/create")
    public ResponseEntity<Post> createPost(
            @RequestParam("content") String content,
            @RequestParam(value = "files", required = false) MultipartFile[] files,
            @AuthenticationPrincipal com.icpconnect.backend.security.SecurityUser principal
    ) {
        Post post = postService.createPost(principal.getUser().getId(), content, files);
        return ResponseEntity.ok(post);
    }
    @GetMapping("/feed")
    public ResponseEntity<List<Post>> getFeed() {
        List<Post> feed = postService.getFeed();
        return ResponseEntity.ok(feed);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Post> getPostById(@PathVariable Long id) {
        Post post = postService.getPostById(id);
        return ResponseEntity.ok(post);
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
    public ResponseEntity<Void> deletePost(@PathVariable Long id, @AuthenticationPrincipal com.icpconnect.backend.security.SecurityUser principal) {
        // Ownership check inside service
        postService.softDeletePost(id);
        return ResponseEntity.noContent().build();
    }
}
