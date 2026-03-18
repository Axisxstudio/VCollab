package com.vtechai.vcollab.conversation;

import com.vtechai.vcollab.common.ApiResponse;
import com.vtechai.vcollab.conversation.dto.ConversationCreateRequest;
import com.vtechai.vcollab.conversation.dto.ConversationResponse;
import com.vtechai.vcollab.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/conversations")
@RequiredArgsConstructor
public class ConversationController {
    private final ConversationService conversationService;

    @PostMapping
    public ResponseEntity<ApiResponse<ConversationResponse>> startConversation(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody ConversationCreateRequest request
    ) {
        ConversationResponse response = conversationService.startConversation(request, principal);
        return ResponseEntity.ok(ApiResponse.ok("Conversation ready", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ConversationResponse>>> list(
        @AuthenticationPrincipal UserPrincipal principal,
        Pageable pageable
    ) {
        Page<ConversationResponse> responses = conversationService.list(principal, pageable);
        return ResponseEntity.ok(ApiResponse.ok("Conversations", responses));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ConversationResponse>> get(
        @PathVariable Long id,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        ConversationResponse response = conversationService.get(id, principal);
        return ResponseEntity.ok(ApiResponse.ok("Conversation", response));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Object>> markRead(
        @PathVariable Long id,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        conversationService.markRead(id, principal);
        return ResponseEntity.ok(ApiResponse.ok("Conversation updated", null));
    }
}
