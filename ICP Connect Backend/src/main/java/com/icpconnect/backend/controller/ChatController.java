package com.icpconnect.backend.controller;

import com.icpconnect.backend.dto.ConversationDTO;
import com.icpconnect.backend.dto.CreateGroupRequest;
import com.icpconnect.backend.dto.MessageDTO;
import com.icpconnect.backend.security.SecurityUser;
import com.icpconnect.backend.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import org.springframework.messaging.simp.SimpMessagingTemplate;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    @PostMapping("/dm/{targetUserId}")
    public ResponseEntity<ConversationDTO> getOrCreateDM(
            @PathVariable Long targetUserId,
            @AuthenticationPrincipal SecurityUser principal) {
        return ResponseEntity.ok(chatService.getOrCreateDM(principal.getUser(), targetUserId));
    }

    @PostMapping("/group")
    public ResponseEntity<ConversationDTO> createGroup(
            @RequestBody CreateGroupRequest request,
            @AuthenticationPrincipal SecurityUser principal) {
        return ResponseEntity.ok(chatService.createGroup(principal.getUser(), request.name(), request.memberIds()));
    }

    @GetMapping
    public ResponseEntity<List<ConversationDTO>> getConversations(
            @AuthenticationPrincipal SecurityUser principal) {
        return ResponseEntity.ok(chatService.getConversations(principal.getUser()));
    }

    @GetMapping("/{conversationId}/messages")
    public ResponseEntity<List<MessageDTO>> getMessages(
            @PathVariable Long conversationId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal SecurityUser principal) {
        return ResponseEntity.ok(chatService.getMessages(principal.getUser(), conversationId, page, size));
    }

    @PostMapping("/{conversationId}/message")
    public ResponseEntity<MessageDTO> sendMessage(
            @PathVariable Long conversationId,
            @RequestBody Map<String, String> payload,
            @AuthenticationPrincipal SecurityUser principal) {
        String content = payload.get("content");
        String type = payload.getOrDefault("messageType", "TEXT");
        MessageDTO msg = chatService.sendMessage(principal.getUser(), conversationId, content, type, null);
        messagingTemplate.convertAndSend("/topic/conversation/" + conversationId, msg);
        return ResponseEntity.ok(msg);
    }

    @PostMapping("/{conversationId}/image")
    public ResponseEntity<MessageDTO> sendImage(
            @PathVariable Long conversationId,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal SecurityUser principal) {
        String mediaUrl = chatService.uploadChatImage(file);
        MessageDTO msg = chatService.sendMessage(principal.getUser(), conversationId, null, "IMAGE", mediaUrl);
        messagingTemplate.convertAndSend("/topic/conversation/" + conversationId, msg);
        return ResponseEntity.ok(msg);
    }
}
