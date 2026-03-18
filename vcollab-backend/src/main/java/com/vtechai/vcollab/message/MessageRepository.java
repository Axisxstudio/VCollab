package com.vtechai.vcollab.message;

import com.vtechai.vcollab.message.entity.Message;
import java.time.Instant;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MessageRepository extends JpaRepository<Message, Long> {
    Page<Message> findByConversationIdAndDeletedAtIsNullOrderByCreatedAtDesc(Long conversationId, Pageable pageable);
    Optional<Message> findTopByConversationIdAndDeletedAtIsNullOrderByCreatedAtDesc(Long conversationId);
    long countByConversationIdAndDeletedAtIsNullAndCreatedAtAfterAndSenderIdNot(Long conversationId, Instant lastReadAt, Long senderId);
    Optional<Message> findByIdAndDeletedAtIsNull(Long id);
    Page<Message> findByDeletedAtIsNotNullOrderByDeletedAtDesc(Pageable pageable);
}
