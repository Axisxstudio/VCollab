package com.vtechai.vcollab.notification;

import com.vtechai.vcollab.notification.entity.Notification;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    Page<Notification> findByRecipientIdAndDeletedAtIsNullOrderByCreatedAtDesc(Long recipientId, Pageable pageable);
    long countByRecipientIdAndReadFalseAndDeletedAtIsNull(Long recipientId);
    List<Notification> findByRecipientIdAndReadFalseAndDeletedAtIsNull(Long recipientId);
    Optional<Notification> findByIdAndRecipientIdAndDeletedAtIsNull(Long id, Long recipientId);
    Page<Notification> findByDeletedAtIsNotNullOrderByDeletedAtDesc(Pageable pageable);
}
