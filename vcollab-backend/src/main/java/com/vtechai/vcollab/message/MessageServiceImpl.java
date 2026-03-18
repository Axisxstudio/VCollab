package com.vtechai.vcollab.message;

import com.vtechai.vcollab.conversation.ConversationMemberRepository;
import com.vtechai.vcollab.conversation.ConversationRepository;
import com.vtechai.vcollab.conversation.entity.Conversation;
import com.vtechai.vcollab.conversation.entity.ConversationMember;
import com.vtechai.vcollab.enums.NotificationType;
import com.vtechai.vcollab.exception.ForbiddenException;
import com.vtechai.vcollab.exception.ResourceNotFoundException;
import com.vtechai.vcollab.message.dto.MessageCreateRequest;
import com.vtechai.vcollab.message.dto.MessageResponse;
import com.vtechai.vcollab.message.dto.MessageUpdateRequest;
import com.vtechai.vcollab.message.entity.Message;
import com.vtechai.vcollab.notification.NotificationService;
import com.vtechai.vcollab.notification.dto.NotificationCreateRequest;
import com.vtechai.vcollab.security.UserPrincipal;
import com.vtechai.vcollab.user.UserRepository;
import com.vtechai.vcollab.user.entity.User;
import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MessageServiceImpl implements MessageService {
    private final MessageRepository messageRepository;
    private final ConversationRepository conversationRepository;
    private final ConversationMemberRepository conversationMemberRepository;
    private final UserRepository userRepository;
    private final MessagePublisher messagePublisher;
    private final NotificationService notificationService;

    @Override
    public Page<MessageResponse> list(Long conversationId, UserPrincipal principal, Pageable pageable) {
        ensureMember(conversationId, principal.getId());
        return messageRepository.findByConversationIdAndDeletedAtIsNullOrderByCreatedAtDesc(conversationId, pageable)
            .map(this::toResponse);
    }

    @Override
    @Transactional
    public MessageResponse send(MessageCreateRequest request, UserPrincipal principal) {
        ConversationMember member = ensureMember(request.getConversationId(), principal.getId());
        Conversation conversation = conversationRepository.findById(request.getConversationId())
            .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));
        User sender = userRepository.findById(principal.getId())
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Message message = Message.builder()
            .conversation(conversation)
            .sender(sender)
            .content(request.getContent())
            .build();
        Message saved = messageRepository.save(message);

        conversation.setUpdatedAt(Instant.now());
        conversationRepository.save(conversation);

        member.setLastReadAt(Instant.now());
        conversationMemberRepository.save(member);

        MessageResponse response = toResponse(saved);
        List<ConversationMember> members = conversationMemberRepository.findByConversationId(conversation.getId());
        for (ConversationMember participant : members) {
            if (participant.getUser().getId().equals(sender.getId())) {
                continue;
            }
            messagePublisher.publishToUser(participant.getUser().getEmail(), response);
            notificationService.send(NotificationCreateRequest.builder()
                .recipientId(participant.getUser().getId())
                .actorId(sender.getId())
                .type(NotificationType.MESSAGE)
                .message("New message from " + sender.getUsername() + ".")
                .build());
        }

        return response;
    }

    @Override
    @Transactional
    public MessageResponse update(Long id, MessageUpdateRequest request, UserPrincipal principal) {
        Message message = messageRepository.findByIdAndDeletedAtIsNull(id)
            .orElseThrow(() -> new ResourceNotFoundException("Message not found"));
        ensureMember(message.getConversation().getId(), principal.getId());
        if (!message.getSender().getId().equals(principal.getId())) {
            throw new ForbiddenException("Not allowed to update this message");
        }

        message.setContent(request.getContent());
        Message saved = messageRepository.save(message);
        MessageResponse response = toResponse(saved);
        publishConversationRefresh(saved.getConversation(), response);
        return response;
    }

    @Override
    @Transactional
    public void delete(Long id, UserPrincipal principal) {
        Message message = messageRepository.findByIdAndDeletedAtIsNull(id)
            .orElseThrow(() -> new ResourceNotFoundException("Message not found"));
        ensureMember(message.getConversation().getId(), principal.getId());
        if (!message.getSender().getId().equals(principal.getId())) {
            throw new ForbiddenException("Not allowed to delete this message");
        }

        message.setDeletedAt(Instant.now());
        message.setDeletedBy(principal.getId());
        Message saved = messageRepository.save(message);
        publishConversationRefresh(saved.getConversation(), toResponse(saved));
    }

    private ConversationMember ensureMember(Long conversationId, Long userId) {
        return conversationMemberRepository.findByConversationIdAndUserId(conversationId, userId)
            .orElseThrow(() -> new ForbiddenException("Not allowed to access this conversation"));
    }

    private void publishConversationRefresh(Conversation conversation, MessageResponse response) {
        List<ConversationMember> members = conversationMemberRepository.findByConversationId(conversation.getId());
        for (ConversationMember participant : members) {
            messagePublisher.publishToUser(participant.getUser().getEmail(), response);
        }
    }

    private MessageResponse toResponse(Message message) {
        User sender = message.getSender();
        String fullName = sender.getProfile() != null ? sender.getProfile().getFullName() : null;
        String profileImage = sender.getProfile() != null ? sender.getProfile().getProfileImage() : null;

        return MessageResponse.builder()
            .id(message.getId())
            .conversationId(message.getConversation().getId())
            .content(message.getContent())
            .createdAt(message.getCreatedAt())
            .sender(MessageResponse.SenderSummary.builder()
                .id(sender.getId())
                .username(sender.getUsername())
                .fullName(fullName)
                .profileImage(profileImage)
                .build())
            .build();
    }
}
