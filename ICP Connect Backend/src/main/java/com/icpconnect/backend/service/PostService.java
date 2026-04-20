package com.icpconnect.backend.service;

import com.icpconnect.backend.dto.LikedUserDTO;
import com.icpconnect.backend.entity.Post;
import com.icpconnect.backend.entity.PostLike;
import com.icpconnect.backend.entity.PostMedia;
import com.icpconnect.backend.entity.User;
import com.icpconnect.backend.repository.PostLikeRepository;
import com.icpconnect.backend.repository.PostMediaRepository;
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
    private final Path root = Paths.get("uploads/posts");

    public PostService(PostRepository postRepository, 
                       PostMediaRepository postMediaRepository, 
                       UserRepository userRepository,
                       PostLikeRepository postLikeRepository) {
        this.postRepository = postRepository;
        this.postMediaRepository = postMediaRepository;
        this.userRepository = userRepository;
        this.postLikeRepository = postLikeRepository;
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
            }
        );
        return post;
    }

    @Transactional
    public void softDeletePost(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));
        post.setDeleted(true);
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
}
