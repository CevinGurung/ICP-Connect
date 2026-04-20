package com.icpconnect.backend.controller;

import com.icpconnect.backend.dto.ChatMessagePayload;
import com.icpconnect.backend.dto.MessageDTO;
import com.icpconnect.backend.security.SecurityUser;
import com.icpconnect.backend.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
@RequiredArgsConstructor
public class ChatWebSocketController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat/{conversationId}")
    public void sendMessage(@DestinationVariable Long conversationId,
                            ChatMessagePayload payload,
                            Principal principal) {
        SecurityUser securityUser = (SecurityUser) ((UsernamePasswordAuthenticationToken) principal).getPrincipal();

        MessageDTO message = chatService.sendMessage(
                securityUser.getUser(),
                conversationId,
                payload.content(),
                payload.messageType() != null ? payload.messageType() : "TEXT",
                null
        );

        // Broadcast to all subscribers of this conversation
        messagingTemplate.convertAndSend("/topic/conversation/" + conversationId, message);
    }
}
