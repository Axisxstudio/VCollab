package com.vtechai.vcollab.notification;

import com.vtechai.vcollab.enums.ContentType;
import com.vtechai.vcollab.enums.NotificationType;
import com.vtechai.vcollab.notification.dto.NotificationCreateRequest;
import com.vtechai.vcollab.user.UserRepository;
import com.vtechai.vcollab.user.entity.User;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MentionService {
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    private static final Pattern MENTION_PATTERN = Pattern.compile("@(\\w+)");

    public void processMentions(String content, Long actorId, ContentType contentType, Long contentId) {
        if (content == null || content.isEmpty()) {
            return;
        }

        Set<String> mentionedUsernames = new HashSet<>();
        Matcher matcher = MENTION_PATTERN.matcher(content);
        boolean mentionAll = false;

        while (matcher.find()) {
            String username = matcher.group(1);
            if ("all".equalsIgnoreCase(username)) {
                mentionAll = true;
            } else {
                mentionedUsernames.add(username);
            }
        }

        if (mentionAll) {
            List<User> allUsers = userRepository.findAll();
            for (User user : allUsers) {
                if (user.getId().equals(actorId)) continue;
                sendMentionNotification(user, actorId, contentType, contentId);
            }
        } else {
            for (String username : mentionedUsernames) {
                userRepository.findByUsername(username).ifPresent(user -> {
                    if (!user.getId().equals(actorId)) {
                        sendMentionNotification(user, actorId, contentType, contentId);
                    }
                });
            }
        }
    }

    private void sendMentionNotification(User recipient, Long actorId, ContentType contentType, Long contentId) {
        NotificationCreateRequest request = NotificationCreateRequest.builder()
            .recipientId(recipient.getId())
            .actorId(actorId)
            .type(NotificationType.MENTION)
            .contentType(contentType)
            .contentId(contentId)
            .message("mentioned you in a " + contentType.name().toLowerCase())
            .build();
        notificationService.send(request);
    }
}
