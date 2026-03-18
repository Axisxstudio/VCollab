package com.vtechai.vcollab.conversation;

import com.vtechai.vcollab.conversation.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {
}
