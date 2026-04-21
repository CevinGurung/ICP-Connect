package com.icpconnect.backend.repository;

import com.icpconnect.backend.entity.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {
    
    @Query("SELECT p FROM Post p WHERE p.isDeleted = false AND p.user.isActive = true ORDER BY p.createdAt DESC")
    List<Post> findAllActivePosts();

    @Query("SELECT p FROM Post p WHERE p.isDeleted = false AND p.user.isActive = true ORDER BY p.createdAt DESC")
    Page<Post> findAllActivePostsPaged(Pageable pageable);

    @Modifying
    @Query("UPDATE Post p SET p.likeCount = p.likeCount + 1 WHERE p.id = :id")
    void incrementLikeCount(@Param("id") Long id);

    @Modifying
    @Query("UPDATE Post p SET p.likeCount = p.likeCount - 1 WHERE p.id = :id AND p.likeCount > 0")
    void decrementLikeCount(@Param("id") Long id);

    @Modifying
    @Query("UPDATE Post p SET p.commentCount = p.commentCount + 1 WHERE p.id = :id")
    void incrementCommentCount(@Param("id") Long id);

    @Modifying
    @Query("UPDATE Post p SET p.commentCount = p.commentCount - 1 WHERE p.id = :id AND p.commentCount > 0")
    void decrementCommentCount(@Param("id") Long id);

    @Query("SELECT p FROM Post p WHERE p.user.id = :userId AND p.isDeleted = false AND p.user.isActive = true ORDER BY p.createdAt DESC")
    List<Post> findByUserIdAndIsDeletedFalseOrderByCreatedAtDesc(@Param("userId") Long userId);

    long countByUserIdAndIsDeletedFalse(Long userId);

    @Query("SELECT COUNT(p) FROM Post p WHERE p.isDeleted = false AND p.user.isActive = true")
    long countByIsDeletedFalse();

    @Query("SELECT COUNT(p) FROM Post p WHERE p.isDeleted = false AND p.user.isActive = true AND p.createdAt >= :start")
    long countByCreatedAtAfter(@Param("start") LocalDateTime start);

    // Posts per day — native query for daily grouping
    @Query(value = "SELECT DATE(p.created_at) as day, COUNT(*) as count FROM posts p JOIN users u ON p.user_id = u.id WHERE p.is_deleted = false AND u.is_active = true AND p.created_at >= :start GROUP BY DATE(p.created_at) ORDER BY day", nativeQuery = true)
    List<Object[]> countPostsPerDay(@Param("start") LocalDateTime start);
}
