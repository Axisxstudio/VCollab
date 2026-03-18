package com.vtechai.vcollab.conversation;

import com.vtechai.vcollab.conversation.dto.ConversationCreateRequest;
import com.vtechai.vcollab.conversation.dto.ConversationResponse;
import com.vtechai.vcollab.security.UserPrincipal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ConversationService {
    ConversationResponse startConversation(ConversationCreateRequest request, UserPrincipal principal);
    Page<ConversationResponse> list(UserPrincipal principal, Pageable pageable);
    ConversationResponse get(Long id, UserPrincipal principal);
    void markRead(Long id, UserPrincipal principal);
}
