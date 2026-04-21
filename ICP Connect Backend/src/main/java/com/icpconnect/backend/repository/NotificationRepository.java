package com.icpconnect.backend.repository;

import com.icpconnect.backend.entity.Notification;
import com.icpconnect.backend.entity.NotificationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    Page<Notification> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    long countByUserIdAndIsReadFalse(Long userId);

    /** Duplicate check: does a notification already exist for this actor → user + type + post combo? */
    boolean existsByUserIdAndActorIdAndTypeAndPostId(
            Long userId, Long actorId, NotificationType type, Long postId);

    /** Duplicate check for follow-type notifications (no post) */
    boolean existsByUserIdAndActorIdAndType(
            Long userId, Long actorId, NotificationType type);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.user.id = :userId AND n.isRead = false")
    void markAllAsReadByUserId(@Param("userId") Long userId);
}
