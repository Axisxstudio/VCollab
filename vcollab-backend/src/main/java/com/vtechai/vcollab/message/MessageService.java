package com.vtechai.vcollab.message;

import com.vtechai.vcollab.message.dto.MessageCreateRequest;
import com.vtechai.vcollab.message.dto.MessageResponse;
import com.vtechai.vcollab.message.dto.MessageUpdateRequest;
import com.vtechai.vcollab.security.UserPrincipal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface MessageService {
    Page<MessageResponse> list(Long conversationId, UserPrincipal principal, Pageable pageable);
    MessageResponse send(MessageCreateRequest request, UserPrincipal principal);
    MessageResponse update(Long id, MessageUpdateRequest request, UserPrincipal principal);
    void markConversationRead(Long conversationId, UserPrincipal principal);
    void delete(Long id, UserPrincipal principal);
}
