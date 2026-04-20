package com.icpconnect.backend.repository;

import com.icpconnect.backend.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    @Query(value = """
        SELECT c.* FROM conversations c
        WHERE c.is_group = false
        AND c.id IN (
            SELECT cm1.conversation_id FROM conversation_members cm1
            WHERE cm1.user_id = :uid1
        )
        AND c.id IN (
            SELECT cm2.conversation_id FROM conversation_members cm2
            WHERE cm2.user_id = :uid2
        )
        LIMIT 1
    """, nativeQuery = true)
    Optional<Conversation> findDMBetweenUsers(@Param("uid1") Long userId1, @Param("uid2") Long userId2);

    @Query(value = """
        SELECT c.* FROM conversations c
        JOIN conversation_members cm ON cm.conversation_id = c.id
        WHERE cm.user_id = :userId
        ORDER BY c.last_message_at DESC NULLS LAST
    """, nativeQuery = true)
    List<Conversation> findConversationsByUserId(@Param("userId") Long userId);
}
