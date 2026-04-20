package com.icpconnect.backend.controller;

import com.icpconnect.backend.dto.CommentDTO;
import com.icpconnect.backend.dto.CommentRequest;
import com.icpconnect.backend.security.SecurityUser;
import com.icpconnect.backend.service.CommentService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class CommentController {

    private final CommentService commentService;

    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    @GetMapping("/posts/{postId}/comments")
    public ResponseEntity<Page<CommentDTO>> getComments(
            @PathVariable Long postId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(commentService.getComments(postId, page, size));
    }

    @PostMapping("/posts/{postId}/comments")
    public ResponseEntity<CommentDTO> addComment(
            @PathVariable Long postId,
            @Valid @RequestBody CommentRequest request,
            @AuthenticationPrincipal SecurityUser principal
    ) {
        return ResponseEntity.ok(commentService.addComment(postId, principal.getUser().getId(), request));
    }

    @PutMapping("/comments/{commentId}")
    public ResponseEntity<CommentDTO> updateComment(
            @PathVariable Long commentId,
            @Valid @RequestBody CommentRequest request,
            @AuthenticationPrincipal SecurityUser principal
    ) {
        return ResponseEntity.ok(commentService.updateComment(commentId, principal.getUser().getId(), request));
    }

    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable Long commentId,
            @AuthenticationPrincipal SecurityUser principal
    ) {
        commentService.deleteComment(commentId, principal.getUser().getId());
        return ResponseEntity.noContent().build();
    }
}
