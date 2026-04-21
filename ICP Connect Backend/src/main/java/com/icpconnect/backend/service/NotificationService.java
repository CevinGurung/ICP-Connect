package com.icpconnect.backend.service;

import com.icpconnect.backend.dto.NotificationDTO;
import com.icpconnect.backend.entity.*;
import com.icpconnect.backend.repository.FollowRepository;
import com.icpconnect.backend.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final FollowRepository followRepository;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Create a notification with duplicate prevention, then push it via WebSocket.
     * Does nothing if the actor is the same as the receiving user (no self-notifications).
     */
    @Transactional
    public void createNotification(User receiver, User actor, NotificationType type,
                                   Post post, Comment comment, String message) {
        // Never notify yourself
        if (receiver.getId().equals(actor.getId())) return;

        // Duplicate check
        if (type == NotificationType.LIKE || type == NotificationType.COMMENT) {
            Long postId = (post != null) ? post.getId() : null;
            if (postId != null && notificationRepository.existsByUserIdAndActorIdAndTypeAndPostId(
                    receiver.getId(), actor.getId(), type, postId)) {
                return; // Already notified
            }
        } else {
            // FOLLOW / FOLLOW_BACK — check without post
            if (notificationRepository.existsByUserIdAndActorIdAndType(
                    receiver.getId(), actor.getId(), type)) {
                return; // Already notified
            }
        }

        Notification notification = Notification.builder()
                .user(receiver)
                .actor(actor)
                .type(type)
                .post(post)
                .comment(comment)
                .message(message)
                .isRead(false)
                .build();

        Notification saved = notificationRepository.save(notification);

        // Build DTO and push via WebSocket
        NotificationDTO dto = mapToDTO(saved, receiver);
        messagingTemplate.convertAndSendToUser(
                receiver.getId().toString(),
                "/queue/notifications",
                dto
        );
    }

    public Page<NotificationDTO> getNotifications(Long userId, User currentUser, Pageable pageable) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(n -> mapToDTO(n, currentUser));
    }

    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    @Transactional
    public void markAsRead(Long notificationId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            n.setRead(true);
            notificationRepository.save(n);
        });
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        notificationRepository.markAllAsReadByUserId(userId);
    }

    private NotificationDTO mapToDTO(Notification n, User currentUser) {
        boolean isFollowing = false;
        boolean isFollowedBy = false;

        if (currentUser != null && n.getActor() != null) {
            isFollowing = followRepository.existsByFollowerIdAndFollowingId(
                    currentUser.getId(), n.getActor().getId());
            isFollowedBy = followRepository.existsByFollowerIdAndFollowingId(
                    n.getActor().getId(), currentUser.getId());
        }

        return new NotificationDTO(
                n.getId(),
                n.getUser().getId(),
                n.getActor().getId(),
                n.getActor().getFullName(),
                n.getActor().getProfileImageUrl(),
                n.getType().name(),
                n.getPost() != null ? n.getPost().getId() : null,
                n.getComment() != null ? n.getComment().getId() : null,
                n.getMessage(),
                n.isRead(),
                n.getCreatedAt(),
                isFollowing,
                isFollowedBy
        );
    }
}
