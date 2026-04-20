package com.icpconnect.backend.repository;

import com.icpconnect.backend.entity.Post;
import com.icpconnect.backend.entity.PostLike;
import com.icpconnect.backend.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PostLikeRepository extends JpaRepository<PostLike, Long> {
    Optional<PostLike> findByPostAndUser(Post post, User user);
    boolean existsByPostIdAndUserId(Long postId, Long userId);
    Page<PostLike> findByPostIdOrderByCreatedAtDesc(Long postId, Pageable pageable);
}
