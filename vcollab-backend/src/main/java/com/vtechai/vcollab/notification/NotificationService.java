package com.vtechai.vcollab.notification;

import com.vtechai.vcollab.notification.dto.NotificationCreateRequest;
import com.vtechai.vcollab.notification.dto.NotificationResponse;
import com.vtechai.vcollab.security.UserPrincipal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface NotificationService {
    void send(NotificationCreateRequest request);
    Page<NotificationResponse> list(UserPrincipal principal, Pageable pageable);
    long unreadCount(UserPrincipal principal);
    NotificationResponse markRead(Long id, UserPrincipal principal);
    int markAllRead(UserPrincipal principal);
    void delete(Long id, UserPrincipal principal);
    int deleteAll(UserPrincipal principal);
}
