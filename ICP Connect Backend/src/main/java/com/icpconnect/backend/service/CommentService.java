package com.icpconnect.backend.service;

import com.icpconnect.backend.dto.CommentDTO;
import com.icpconnect.backend.dto.CommentRequest;
import com.icpconnect.backend.entity.Comment;
import com.icpconnect.backend.entity.Post;
import com.icpconnect.backend.entity.User;
import com.icpconnect.backend.repository.CommentRepository;
import com.icpconnect.backend.repository.PostRepository;
import com.icpconnect.backend.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;

    public CommentService(CommentRepository commentRepository, 
                          PostRepository postRepository, 
                          UserRepository userRepository) {
        this.commentRepository = commentRepository;
        this.postRepository = postRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public CommentDTO addComment(Long postId, Long userId, CommentRequest request) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Comment comment = new Comment();
        comment.setPost(post);
        comment.setUser(user);
        comment.setContent(request.content());
        
        Comment saved = commentRepository.save(comment);
        postRepository.incrementCommentCount(postId);

        return mapToDTO(saved);
    }

    @Transactional
    public CommentDTO updateComment(Long commentId, Long userId, CommentRequest request) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found"));

        if (!comment.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("You are not authorized to edit this comment");
        }

        if (comment.isDeleted()) {
            throw new IllegalArgumentException("Cannot edit a deleted comment");
        }

        comment.setContent(request.content());
        return mapToDTO(commentRepository.save(comment));
    }

    @Transactional
    public void deleteComment(Long commentId, Long userId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found"));

        if (!comment.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("You are not authorized to delete this comment");
        }

        if (!comment.isDeleted()) {
            comment.setDeleted(true);
            commentRepository.save(comment);
            postRepository.decrementCommentCount(comment.getPost().getId());
        }
    }

    public Page<CommentDTO> getComments(Long postId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return commentRepository.findByPostIdAndIsDeletedFalseOrderByCreatedAtAsc(postId, pageable)
                .map(this::mapToDTO);
    }

    private CommentDTO mapToDTO(Comment comment) {
        return CommentDTO.builder()
                .id(comment.getId())
                .content(comment.getContent())
                .userId(comment.getUser().getId())
                .fullName(comment.getUser().getFullName())
                .profileImageUrl(comment.getUser().getProfileImageUrl())
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .build();
    }
}
