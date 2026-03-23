package com.vtechai.vcollab.presence.entity;

import com.vtechai.vcollab.common.BaseEntity;
import com.vtechai.vcollab.conversation.entity.Conversation;
import com.vtechai.vcollab.enums.PresenceStatus;
import com.vtechai.vcollab.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(
    name = "user_presence",
    uniqueConstraints = @UniqueConstraint(columnNames = "user_id")
)
public class UserPresence extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PresenceStatus status;

    @Column(name = "session_count", nullable = false)
    private int sessionCount;

    @Column(name = "last_seen_at")
    private Instant lastSeenAt;

    @Column(name = "last_heartbeat_at")
    private Instant lastHeartbeatAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "active_conversation_id")
    private Conversation activeConversation;
}
