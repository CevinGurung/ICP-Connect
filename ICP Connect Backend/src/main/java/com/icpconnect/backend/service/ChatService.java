package com.icpconnect.backend.service;

import com.icpconnect.backend.dto.ConversationDTO;
import com.icpconnect.backend.dto.MessageDTO;
import com.icpconnect.backend.entity.*;
import com.icpconnect.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ConversationRepository conversationRepository;
    private final ConversationMemberRepository memberRepository;
    private final ChatMessageRepository messageRepository;
    private final FollowRepository followRepository;
    private final UserRepository userRepository;
    private final EncryptionService encryptionService;

    private final Path chatUploadRoot = Paths.get("uploads/chat");

    /* ============ DM ============ */

    @Transactional
    public ConversationDTO getOrCreateDM(User currentUser, Long targetUserId) {
        if (currentUser.getId().equals(targetUserId)) {
            throw new IllegalArgumentException("Cannot message yourself");
        }

        User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // Check mutual follow
        boolean iFollow = followRepository.existsByFollowerIdAndFollowingId(currentUser.getId(), targetUserId);
        boolean theyFollow = followRepository.existsByFollowerIdAndFollowingId(targetUserId, currentUser.getId());
        if (!iFollow || !theyFollow) {
            throw new SecurityException("You must be mutually connected to message this user");
        }

        // Find existing DM
        Conversation conv = conversationRepository.findDMBetweenUsers(currentUser.getId(), targetUserId)
                .orElseGet(() -> {
                    Conversation newConv = Conversation.builder()
                            .isGroup(false)
                            .createdBy(currentUser)
                            .build();
                    conversationRepository.save(newConv);

                    memberRepository.save(ConversationMember.builder()
                            .conversation(newConv).user(currentUser).role("MEMBER").build());
                    memberRepository.save(ConversationMember.builder()
                            .conversation(newConv).user(target).role("MEMBER").build());

                    return newConv;
                });

        return toConversationDTO(conv);
    }

    /* ============ GROUP ============ */

    @Transactional
    public ConversationDTO createGroup(User currentUser, String name, List<Long> memberIds) {
        Conversation conv = Conversation.builder()
                .isGroup(true)
                .name(name)
                .createdBy(currentUser)
                .build();
        conversationRepository.save(conv);

        // Add creator as OWNER
        memberRepository.save(ConversationMember.builder()
                .conversation(conv).user(currentUser).role("OWNER").build());

        // Add members
        for (Long memberId : memberIds) {
            if (memberId.equals(currentUser.getId())) continue;
            userRepository.findById(memberId).ifPresent(user ->
                memberRepository.save(ConversationMember.builder()
                        .conversation(conv).user(user).role("MEMBER").build())
            );
        }

        return toConversationDTO(conv);
    }

    /* ============ LIST CONVERSATIONS ============ */

    public List<ConversationDTO> getConversations(User currentUser) {
        List<Conversation> conversations = conversationRepository.findConversationsByUserId(currentUser.getId());
        return conversations.stream().map(this::toConversationDTO).toList();
    }

    /* ============ MESSAGES ============ */

    public List<MessageDTO> getMessages(User currentUser, Long conversationId, int page, int size) {
        if (!memberRepository.existsByConversationIdAndUserId(conversationId, currentUser.getId())) {
            throw new SecurityException("Not a member of this conversation");
        }

        List<ChatMessage> messages = messageRepository
                .findByConversationIdAndIsDeletedFalseOrderByCreatedAtDesc(conversationId, PageRequest.of(page, size));

        // Return in chronological order (oldest first)
        return messages.reversed().stream().map(this::toMessageDTO).toList();
    }

    @Transactional
    public MessageDTO sendMessage(User sender, Long conversationId, String content, String messageType, String mediaUrl) {
        if (!memberRepository.existsByConversationIdAndUserId(conversationId, sender.getId())) {
            throw new SecurityException("Not a member of this conversation");
        }

        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));

        ChatMessage msg = ChatMessage.builder()
                .conversation(conv)
                .sender(sender)
                .content(content != null ? encryptionService.encrypt(content) : null)
                .messageType(messageType != null ? messageType : "TEXT")
                .mediaUrl(mediaUrl)
                .build();
        messageRepository.save(msg);

        conv.setLastMessageAt(LocalDateTime.now());
        conversationRepository.save(conv);

        return toMessageDTO(msg);
    }

    /* ============ IMAGE UPLOAD ============ */

    public String uploadChatImage(MultipartFile file) {
        try {
            Files.createDirectories(chatUploadRoot);
            String filename = UUID.randomUUID() + "_" + file.getOriginalFilename();
            Files.copy(file.getInputStream(), chatUploadRoot.resolve(filename));
            return "/uploads/chat/" + filename;
        } catch (IOException e) {
            throw new RuntimeException("Failed to upload chat image", e);
        }
    }

    /* ============ MAPPERS ============ */

    private ConversationDTO toConversationDTO(Conversation conv) {
        List<ConversationMember> members = memberRepository.findByConversationId(conv.getId());

        List<ConversationDTO.MemberDTO> memberDTOs = members.stream()
                .map(m -> new ConversationDTO.MemberDTO(
                        m.getUser().getId(),
                        m.getUser().getFullName(),
                        m.getUser().getUserName(),
                        m.getUser().getProfileImageUrl(),
                        m.getRole()
                )).toList();

        // Get last message
        MessageDTO lastMessage = messageRepository.findFirstByConversationIdOrderByCreatedAtDesc(conv.getId())
                .map(this::toMessageDTO)
                .orElse(null);

        return new ConversationDTO(
                conv.getId(),
                conv.isGroup(),
                conv.getName(),
                memberDTOs,
                lastMessage,
                conv.getLastMessageAt()
        );
    }

    private MessageDTO toMessageDTO(ChatMessage msg) {
        return new MessageDTO(
                msg.getId(),
                msg.getConversation().getId(),
                msg.getSender().getId(),
                msg.getSender().getFullName(),
                msg.getSender().getProfileImageUrl(),
                encryptionService.decrypt(msg.getContent()),
                msg.getMessageType(),
                msg.getMediaUrl(),
                msg.getCreatedAt()
        );
    }
}
