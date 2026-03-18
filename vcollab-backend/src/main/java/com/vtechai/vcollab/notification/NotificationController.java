package com.vtechai.vcollab.notification;

import com.vtechai.vcollab.common.ApiResponse;
import com.vtechai.vcollab.notification.dto.NotificationCountResponse;
import com.vtechai.vcollab.notification.dto.NotificationResponse;
import com.vtechai.vcollab.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {
    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<NotificationResponse>>> list(
        @AuthenticationPrincipal UserPrincipal principal,
        Pageable pageable
    ) {
        Page<NotificationResponse> notifications = notificationService.list(principal, pageable);
        return ResponseEntity.ok(ApiResponse.ok("Notifications", notifications));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<NotificationCountResponse>> unreadCount(
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        long count = notificationService.unreadCount(principal);
        return ResponseEntity.ok(ApiResponse.ok("Unread count", new NotificationCountResponse(count)));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<ApiResponse<NotificationResponse>> markRead(
        @PathVariable Long id,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        NotificationResponse response = notificationService.markRead(id, principal);
        return ResponseEntity.ok(ApiResponse.ok("Notification updated", response));
    }

    @PatchMapping("/read-all")
    public ResponseEntity<ApiResponse<NotificationCountResponse>> markAllRead(
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        int count = notificationService.markAllRead(principal);
        return ResponseEntity.ok(ApiResponse.ok("Notifications updated", new NotificationCountResponse(count)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Object>> delete(
        @PathVariable Long id,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        notificationService.delete(id, principal);
        return ResponseEntity.ok(ApiResponse.ok("Notification deleted", null));
    }

    @DeleteMapping("/clear-all")
    public ResponseEntity<ApiResponse<NotificationCountResponse>> deleteAll(
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        int count = notificationService.deleteAll(principal);
        return ResponseEntity.ok(ApiResponse.ok("Notifications cleared", new NotificationCountResponse(count)));
    }
}
