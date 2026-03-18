package com.vtechai.vcollab.conversation;

import com.vtechai.vcollab.conversation.entity.ConversationMember;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ConversationMemberRepository extends JpaRepository<ConversationMember, Long> {
    @Query("select cm from ConversationMember cm where cm.user.id = :userId order by cm.conversation.updatedAt desc")
    Page<ConversationMember> findByUserIdOrderByConversationUpdatedAtDesc(@Param("userId") Long userId, Pageable pageable);

    Optional<ConversationMember> findByConversationIdAndUserId(Long conversationId, Long userId);

    List<ConversationMember> findByConversationId(Long conversationId);

    @Query("""
        select cm1.conversation.id
        from ConversationMember cm1
        join ConversationMember cm2 on cm1.conversation.id = cm2.conversation.id
        where cm1.user.id = :userId1 and cm2.user.id = :userId2
        """)
    Optional<Long> findConversationIdBetween(@Param("userId1") Long userId1, @Param("userId2") Long userId2);
}
