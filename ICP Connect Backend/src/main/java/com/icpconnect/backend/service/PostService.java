package com.icpconnect.backend.service;

import com.icpconnect.backend.dto.LikedUserDTO;
import com.icpconnect.backend.entity.*;
import com.icpconnect.backend.repository.PostLikeRepository;
import com.icpconnect.backend.repository.PostMediaRepository;
import com.icpconnect.backend.repository.PostReportRepository;
import com.icpconnect.backend.repository.PostRepository;
import com.icpconnect.backend.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class PostService {

    private final PostRepository postRepository;
    private final PostMediaRepository postMediaRepository;
    private final UserRepository userRepository;
    private final PostLikeRepository postLikeRepository;
    private final PostReportRepository postReportRepository;
    private final NotificationService notificationService;
    private final Path root = Paths.get("uploads/posts");

    public PostService(PostRepository postRepository, 
                       PostMediaRepository postMediaRepository, 
                       UserRepository userRepository,
                       PostLikeRepository postLikeRepository,
                       PostReportRepository postReportRepository,
                       NotificationService notificationService) {
        this.postRepository = postRepository;
        this.postMediaRepository = postMediaRepository;
        this.userRepository = userRepository;
        this.postLikeRepository = postLikeRepository;
        this.postReportRepository = postReportRepository;
        this.notificationService = notificationService;
    }

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(root);
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize folder for upload!");
        }
    }

    @Transactional
    public Post createPost(Long userId, String content, MultipartFile[] files) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Post post = new Post();
        post.setUser(user);
        post.setContent(content);
        Post savedPost = postRepository.save(post);

        if (files != null && files.length > 0) {
            List<PostMedia> mediaList = new ArrayList<>();
            
            // Check if it's a video or images
            boolean hasVideo = false;
            for (MultipartFile file : files) {
                if (file.getContentType() != null && file.getContentType().startsWith("video/")) {
                    hasVideo = true;
                    break;
                }
            }

            if (hasVideo && files.length > 1) {
                throw new IllegalArgumentException("Cannot upload multiple videos or mix images/videos.");
            }

            for (MultipartFile file : files) {
                String mediaUrl = saveFile(file);
                String contentType = file.getContentType();
                String mediaType = (contentType != null && contentType.startsWith("video/")) ? "VIDEO" : "IMAGE";
                mediaList.add(new PostMedia(savedPost, mediaUrl, mediaType));
            }
            postMediaRepository.saveAll(mediaList);
            savedPost.setMedia(mediaList);
        }

        return savedPost;
    }

    public List<Post> getFeed(Long currentUserId) {
        List<Post> posts = postRepository.findAllActivePosts();
        if (currentUserId != null) {
            for (Post post : posts) {
                post.setLiked(postLikeRepository.existsByPostIdAndUserId(post.getId(), currentUserId));
            }
        }
        return posts;
    }
    
    public Post getPostById(Long id, Long currentUserId) {
        Post post = postRepository.findById(id)
                .filter(p -> !p.isDeleted())
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));
        if (currentUserId != null) {
            post.setLiked(postLikeRepository.existsByPostIdAndUserId(post.getId(), currentUserId));
        }
        return post;
    }

    public Page<LikedUserDTO> getPostLikes(Long postId, Pageable pageable) {
        return postLikeRepository.findByPostIdOrderByCreatedAtDesc(postId, pageable)
                .map(like -> new LikedUserDTO(
                        like.getUser().getId(),
                        like.getUser().getFullName(),
                        like.getUser().getProgram(),
                        like.getUser().getYear()
                ));
    }

    @Transactional
    public Post toggleLike(Long postId, Long userId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        postLikeRepository.findByPostAndUser(post, user).ifPresentOrElse(
            like -> {
                postLikeRepository.delete(like);
                postRepository.decrementLikeCount(postId);
                post.setLikeCount(post.getLikeCount() - 1);
                post.setLiked(false);
            },
            () -> {
                postLikeRepository.save(new PostLike(user, post));
                postRepository.incrementLikeCount(postId);
                post.setLikeCount(post.getLikeCount() + 1);
                post.setLiked(true);

                // Fire LIKE notification (duplicate-safe, self-safe)
                notificationService.createNotification(
                        post.getUser(), user, NotificationType.LIKE,
                        post, null,
                        user.getFullName() + " liked your post"
                );
            }
        );
        return post;
    }

    @Transactional
    public void softDeletePost(Long postId, User principalUser) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));

        // Fetch fresh user from DB to ensure latest role (e.g. if updated via DB manually)
        User currentUser = userRepository.findById(principalUser.getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // Teachers can delete any post; students can only delete their own
        boolean isOwner = post.getUser().getId().equals(currentUser.getId());
        boolean isTeacher = currentUser.getRole() == Role.TEACHER;

        if (!isOwner && !isTeacher) {
            throw new IllegalArgumentException("You are not authorized to delete this post. Role found: " + currentUser.getRole());
        }

        post.setDeleted(true);
        postRepository.save(post);
    }

    public List<Post> getPostsByUserId(Long targetUserId, Long currentUserId) {
        List<Post> posts = postRepository.findByUserIdAndIsDeletedFalseOrderByCreatedAtDesc(targetUserId);
        if (currentUserId != null) {
            posts.forEach(p -> {
                p.setLiked(postLikeRepository.existsByPostIdAndUserId(p.getId(), currentUserId));
            });
        }
        return posts;
    }

    @Transactional
    public void sharePost(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));
        Integer currentShares = post.getShareCount();
        post.setShareCount((currentShares == null ? 0 : currentShares) + 1);
        postRepository.save(post);
    }

    @Transactional
    public Post updatePost(Long postId, String newContent, MultipartFile[] files, List<Long> removedMediaIds, Long userId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));
        
        if (!post.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("You can only edit your own posts");
        }
        
        post.setContent(newContent);
        
        // Remove specific media items if IDs provided
        if (removedMediaIds != null && !removedMediaIds.isEmpty()) {
            post.getMedia().removeIf(m -> removedMediaIds.contains(m.getId()));
        }
        
        // Add new files if any
        if (files != null && files.length > 0) {
            for (MultipartFile file : files) {
                String mediaUrl = saveFile(file);
                String contentType = file.getContentType();
                String mediaType = (contentType != null && contentType.startsWith("video/")) ? "VIDEO" : "IMAGE";
                
                // Managed by CascadeType.ALL, so just add to the collection
                post.getMedia().add(new PostMedia(post, mediaUrl, mediaType));
            }
        }
        
        return postRepository.save(post);
    }

    private String saveFile(MultipartFile file) {
        try {
            String filename = UUID.randomUUID() + "_" + file.getOriginalFilename();
            Files.copy(file.getInputStream(), this.root.resolve(filename), StandardCopyOption.REPLACE_EXISTING);
            return "/uploads/posts/" + filename;
        } catch (Exception e) {
            throw new RuntimeException("Could not store the file. Error: " + e.getMessage());
        }
    }

    @Transactional
    public void reportPost(Long postId, User reporter, String reason) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));

        // Prevent duplicate reports
        if (postReportRepository.existsByReporterIdAndPostId(reporter.getId(), postId)) {
            throw new IllegalArgumentException("You have already reported this post");
        }

        // Prevent self-report
        if (post.getUser().getId().equals(reporter.getId())) {
            throw new IllegalArgumentException("You cannot report your own post");
        }

        PostReport report = new PostReport();
        report.setReporter(reporter);
        report.setPost(post);
        report.setReason(reason);
        postReportRepository.save(report);
    }
}
