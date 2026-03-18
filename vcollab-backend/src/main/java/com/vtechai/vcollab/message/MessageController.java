package com.vtechai.vcollab.message;

import com.vtechai.vcollab.common.ApiResponse;
import com.vtechai.vcollab.message.dto.MessageCreateRequest;
import com.vtechai.vcollab.message.dto.MessageResponse;
import com.vtechai.vcollab.message.dto.MessageUpdateRequest;
import com.vtechai.vcollab.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/messages")
@RequiredArgsConstructor
public class MessageController {
    private final MessageService messageService;

    @GetMapping("/conversations/{conversationId}")
    public ResponseEntity<ApiResponse<Page<MessageResponse>>> list(
        @PathVariable Long conversationId,
        @AuthenticationPrincipal UserPrincipal principal,
        Pageable pageable
    ) {
        Page<MessageResponse> responses = messageService.list(conversationId, principal, pageable);
        return ResponseEntity.ok(ApiResponse.ok("Messages", responses));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<MessageResponse>> send(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody MessageCreateRequest request
    ) {
        MessageResponse response = messageService.send(request, principal);
        return ResponseEntity.ok(ApiResponse.ok("Message sent", response));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<MessageResponse>> update(
        @PathVariable Long id,
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody MessageUpdateRequest request
    ) {
        MessageResponse response = messageService.update(id, request, principal);
        return ResponseEntity.ok(ApiResponse.ok("Message updated", response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Object>> delete(
        @PathVariable Long id,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        messageService.delete(id, principal);
        return ResponseEntity.ok(ApiResponse.ok("Message deleted", null));
    }
}
