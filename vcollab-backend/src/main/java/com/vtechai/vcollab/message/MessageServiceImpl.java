package com.vtechai.vcollab.message;

import com.vtechai.vcollab.conversation.ConversationMemberRepository;
import com.vtechai.vcollab.conversation.ConversationRepository;
import com.vtechai.vcollab.conversation.entity.Conversation;
import com.vtechai.vcollab.conversation.entity.ConversationMember;
import com.vtechai.vcollab.enums.MessageType;
import com.vtechai.vcollab.enums.NotificationType;
import com.vtechai.vcollab.exception.ForbiddenException;
import com.vtechai.vcollab.exception.ResourceNotFoundException;
import com.vtechai.vcollab.message.dto.MessageCreateRequest;
import com.vtechai.vcollab.message.dto.MessageResponse;
import com.vtechai.vcollab.message.dto.MessageStatusEvent;
import com.vtechai.vcollab.message.dto.MessageUpdateRequest;
import com.vtechai.vcollab.message.entity.Message;
import com.vtechai.vcollab.notification.NotificationService;
import com.vtechai.vcollab.notification.dto.NotificationCreateRequest;
import com.vtechai.vcollab.security.UserPrincipal;
import com.vtechai.vcollab.user.UserRepository;
import com.vtechai.vcollab.user.entity.User;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
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
    @Transactional
    public Page<MessageResponse> list(Long conversationId, UserPrincipal principal, Pageable pageable) {
        ensureMember(conversationId, principal.getId());
        markConversationDelivered(conversationId, principal.getId());
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
        Instant now = Instant.now();
        String normalizedContent = normalizeContent(request.getContent());
        String normalizedAttachmentUrl = normalizeAttachmentUrl(request.getAttachmentUrl());

        validateMessagePayload(normalizedContent, normalizedAttachmentUrl);

        Message message = Message.builder()
            .conversation(conversation)
            .sender(sender)
            .content(normalizedContent)
            .attachmentUrl(normalizedAttachmentUrl)
            .messageType(normalizedAttachmentUrl != null ? MessageType.IMAGE : MessageType.TEXT)
            .build();
        Message saved = messageRepository.save(message);

        updateConversationSnapshot(conversation, saved, now);

        member.setLastReadAt(now);
        member.setLastDeliveredAt(now);
        conversationMemberRepository.save(member);

        MessageResponse response = toResponse(saved);
        List<ConversationMember> members = conversationMemberRepository.findByConversationId(conversation.getId());
        for (ConversationMember participant : members) {
            messagePublisher.publishToUser(participant.getUser().getUsername(), response);
            if (!participant.getUser().getId().equals(sender.getId())) {
                notificationService.send(NotificationCreateRequest.builder()
                    .recipientId(participant.getUser().getId())
                    .actorId(sender.getId())
                    .type(NotificationType.MESSAGE)
                    .message("New message from " + sender.getUsername() + ".")
                    .build());
            }
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

        String normalizedContent = normalizeContent(request.getContent());
        validateMessagePayload(normalizedContent, normalizeAttachmentUrl(message.getAttachmentUrl()));
        message.setContent(normalizedContent);
        Message saved = messageRepository.save(message);
        MessageResponse response = toResponse(saved);
        publishConversationRefresh(saved.getConversation(), response);
        return response;
    }

    @Override
    @Transactional
    public void markConversationRead(Long conversationId, UserPrincipal principal) {
        ConversationMember member = ensureMember(conversationId, principal.getId());
        Instant now = Instant.now();
        Map<Long, Message> updated = new LinkedHashMap<>();

        List<Message> pendingDelivered = messageRepository
            .findByConversationIdAndDeletedAtIsNullAndSenderIdNotAndDeliveredAtIsNull(conversationId, principal.getId());
        for (Message message : pendingDelivered) {
            message.setDeliveredAt(now);
            updated.put(message.getId(), message);
        }

        List<Message> pendingRead = messageRepository
            .findByConversationIdAndDeletedAtIsNullAndSenderIdNotAndReadAtIsNull(conversationId, principal.getId());
        for (Message message : pendingRead) {
            if (message.getDeliveredAt() == null) {
                message.setDeliveredAt(now);
            }
            message.setReadAt(now);
            updated.put(message.getId(), message);
        }

        if (!updated.isEmpty()) {
            List<Message> updatedMessages = List.copyOf(updated.values());
            messageRepository.saveAll(updatedMessages);
            publishStatusEvent(conversationId, updatedMessages, "message.read");
        }

        member.setLastDeliveredAt(now);
        member.setLastReadAt(now);
        conversationMemberRepository.save(member);
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
        message.setDeleted(true);
        Message saved = messageRepository.save(message);
        syncConversationSnapshotFromLatestMessage(saved.getConversation());
        publishConversationRefresh(saved.getConversation(), toResponse(saved));
    }

    private ConversationMember ensureMember(Long conversationId, Long userId) {
        return conversationMemberRepository.findByConversationIdAndUserId(conversationId, userId)
            .orElseThrow(() -> new ForbiddenException("Not allowed to access this conversation"));
    }

    private void publishConversationRefresh(Conversation conversation, MessageResponse response) {
        List<ConversationMember> members = conversationMemberRepository.findByConversationId(conversation.getId());
        for (ConversationMember participant : members) {
            messagePublisher.publishToUser(participant.getUser().getUsername(), response);
        }
    }

    private void markConversationDelivered(Long conversationId, Long viewerId) {
        ConversationMember member = ensureMember(conversationId, viewerId);
        List<Message> pendingDelivered = messageRepository
            .findByConversationIdAndDeletedAtIsNullAndSenderIdNotAndDeliveredAtIsNull(conversationId, viewerId);
        if (pendingDelivered.isEmpty()) {
            return;
        }

        Instant now = Instant.now();
        pendingDelivered.forEach((message) -> message.setDeliveredAt(now));
        messageRepository.saveAll(pendingDelivered);

        member.setLastDeliveredAt(now);
        conversationMemberRepository.save(member);
        publishStatusEvent(conversationId, pendingDelivered, "message.delivered");
    }

    private void publishStatusEvent(Long conversationId, List<Message> messages, String eventType) {
        if (messages.isEmpty()) {
            return;
        }

        MessageStatusEvent event = MessageStatusEvent.builder()
            .eventType(eventType)
            .conversationId(conversationId)
            .messageIds(messages.stream().map(Message::getId).toList())
            .occurredAt(Instant.now())
            .build();

        List<ConversationMember> members = conversationMemberRepository.findByConversationId(conversationId);
        for (ConversationMember participant : members) {
            messagePublisher.publishToUser(participant.getUser().getUsername(), event);
        }
    }

    private void updateConversationSnapshot(Conversation conversation, Message message, Instant occurredAt) {
        conversation.setLastMessageId(message.getId());
        conversation.setLastMessageAt(message.getCreatedAt());
        conversation.setUpdatedAt(occurredAt);
        conversationRepository.save(conversation);
    }

    private void syncConversationSnapshotFromLatestMessage(Conversation conversation) {
        Message latestMessage = messageRepository
            .findTopByConversationIdAndDeletedAtIsNullOrderByCreatedAtDesc(conversation.getId())
            .orElse(null);

        if (latestMessage == null) {
            conversation.setLastMessageId(null);
            conversation.setLastMessageAt(null);
        } else {
            conversation.setLastMessageId(latestMessage.getId());
            conversation.setLastMessageAt(latestMessage.getCreatedAt());
        }

        conversationRepository.save(conversation);
    }

    private MessageResponse toResponse(Message message) {
        User sender = message.getSender();
        String fullName = sender.getProfile() != null ? sender.getProfile().getFullName() : null;
        String profileImage = sender.getProfile() != null ? sender.getProfile().getProfileImage() : null;

        return MessageResponse.builder()
            .id(message.getId())
            .conversationId(message.getConversation().getId())
            .content(message.getContent())
            .messageType(message.getMessageType())
            .attachmentUrl(message.getAttachmentUrl())
            .createdAt(message.getCreatedAt())
            .deliveredAt(message.getDeliveredAt())
            .readAt(message.getReadAt())
            .sender(MessageResponse.SenderSummary.builder()
                .id(sender.getId())
                .username(sender.getUsername())
                .fullName(fullName)
                .profileImage(profileImage)
                .build())
            .build();
    }

    private void validateMessagePayload(String content, String attachmentUrl) {
        if (content.isBlank() && attachmentUrl == null) {
            throw new IllegalArgumentException("Message text or image is required");
        }
    }

    private String normalizeContent(String content) {
        return content == null ? "" : content.trim();
    }

    private String normalizeAttachmentUrl(String attachmentUrl) {
        if (attachmentUrl == null) {
            return null;
        }
        String trimmed = attachmentUrl.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
