package com.vtechai.vcollab.conversation;

import com.vtechai.vcollab.conversation.dto.ConversationCreateRequest;
import com.vtechai.vcollab.conversation.dto.ConversationResponse;
import com.vtechai.vcollab.conversation.entity.Conversation;
import com.vtechai.vcollab.conversation.entity.ConversationMember;
import com.vtechai.vcollab.exception.ForbiddenException;
import com.vtechai.vcollab.exception.ResourceNotFoundException;
import com.vtechai.vcollab.message.MessageRepository;
import com.vtechai.vcollab.message.MessageService;
import com.vtechai.vcollab.message.entity.Message;
import com.vtechai.vcollab.presence.PresenceService;
import com.vtechai.vcollab.presence.dto.PresenceResponse;
import com.vtechai.vcollab.security.UserPrincipal;
import com.vtechai.vcollab.user.UserRepository;
import com.vtechai.vcollab.user.entity.User;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ConversationServiceImpl implements ConversationService {
    private final ConversationRepository conversationRepository;
    private final ConversationMemberRepository conversationMemberRepository;
    private final MessageRepository messageRepository;
    private final MessageService messageService;
    private final PresenceService presenceService;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public ConversationResponse startConversation(ConversationCreateRequest request, UserPrincipal principal) {
        if (request.getUserId().equals(principal.getId())) {
            throw new ForbiddenException("You cannot message yourself");
        }

        User currentUser = getUser(principal.getId());
        User target = getUser(request.getUserId());

        List<Long> existingIds = conversationMemberRepository
                .findConversationIdBetween(currentUser.getId(), target.getId());
        if (!existingIds.isEmpty()) {
            Conversation conversation = conversationRepository.findById(existingIds.get(0))
                    .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));
            return mapConversation(conversation, currentUser.getId());
        }

        Conversation conversation = Conversation.builder()
                .createdBy(currentUser)
                .build();
        Conversation saved = conversationRepository.save(conversation);

        ConversationMember memberA = ConversationMember.builder()
                .conversation(saved)
                .user(currentUser)
                .lastReadAt(Instant.now())
                .build();
        ConversationMember memberB = ConversationMember.builder()
                .conversation(saved)
                .user(target)
                .build();
        conversationMemberRepository.saveAll(List.of(memberA, memberB));

        return mapConversation(saved, currentUser.getId());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ConversationResponse> list(UserPrincipal principal, Pageable pageable) {
        return conversationMemberRepository
                .findByUserIdOrderByConversationUpdatedAtDesc(principal.getId(), pageable)
                .map(member -> mapConversation(member.getConversation(), principal.getId()));
    }

    @Override
    @Transactional(readOnly = true)
    public ConversationResponse get(Long id, UserPrincipal principal) {
        Conversation conversation = conversationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));
        ensureMember(id, principal.getId());
        return mapConversation(conversation, principal.getId());
    }

    @Override
    @Transactional
    public void markRead(Long id, UserPrincipal principal) {
        ensureMember(id, principal.getId());
        messageService.markConversationRead(id, principal);
    }

    private ConversationMember ensureMember(Long conversationId, Long userId) {
        return conversationMemberRepository.findByConversationIdAndUserId(conversationId, userId)
                .orElseThrow(() -> new ForbiddenException("Not allowed to access this conversation"));
    }

    private User getUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (user.getDeletedAt() != null) {
            throw new ResourceNotFoundException("User not found");
        }
        return user;
    }

    private ConversationResponse mapConversation(Conversation conversation, Long viewerId) {
        List<ConversationMember> members = conversationMemberRepository.findByConversationId(conversation.getId());
        Map<Long, PresenceResponse> presenceMap = presenceService.getPresenceMap(
                members.stream().map(member -> member.getUser().getId()).toList());
        List<ConversationResponse.ParticipantSummary> participants = members.stream()
                .map(member -> mapParticipant(member.getUser(), presenceMap.get(member.getUser().getId())))
                .toList();

        Message lastMessage = messageRepository
                .findTopByConversationIdAndDeletedAtIsNullOrderByCreatedAtDesc(conversation.getId())
                .orElse(null);
        ConversationResponse.MessagePreview preview = null;
        if (lastMessage != null) {
            preview = ConversationResponse.MessagePreview.builder()
                    .id(lastMessage.getId())
                    .content(lastMessage.getContent())
                    .messageType(lastMessage.getMessageType())
                    .attachmentUrl(lastMessage.getAttachmentUrl())
                    .createdAt(lastMessage.getCreatedAt())
                    .senderId(lastMessage.getSender().getId())
                    .build();
        }

        Instant lastReadAt = members.stream()
                .filter(member -> member.getUser().getId().equals(viewerId))
                .map(ConversationMember::getLastReadAt)
                .findFirst()
                .orElse(null);
        Instant since = lastReadAt != null ? lastReadAt : Instant.EPOCH;
        long unreadCount = messageRepository.countByConversationIdAndDeletedAtIsNullAndCreatedAtAfterAndSenderIdNot(
                conversation.getId(),
                since,
                viewerId);

        return ConversationResponse.builder()
                .id(conversation.getId())
                .participants(participants)
                .lastMessage(preview)
                .unreadCount(unreadCount)
                .build();
    }

    private ConversationResponse.ParticipantSummary mapParticipant(User user, PresenceResponse presence) {
        String fullName = user.getProfile() != null ? user.getProfile().getFullName() : null;
        String profileImage = user.getProfile() != null ? user.getProfile().getProfileImage() : null;
        return ConversationResponse.ParticipantSummary.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(fullName)
                .profileImage(profileImage)
                .online(presence != null && presence.isOnline())
                .lastSeenAt(presence != null ? presence.getLastSeenAt() : null)
                .build();
    }
}
