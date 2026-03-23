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
    @Query("""
        select cm
        from ConversationMember cm
        where cm.user.id = :userId
          and cm.deletedAt is null
          and cm.conversation.deletedAt is null
        order by coalesce(cm.conversation.updatedAt, cm.conversation.createdAt) desc
        """)
    Page<ConversationMember> findByUserIdOrderByConversationUpdatedAtDesc(@Param("userId") Long userId, Pageable pageable);

    @Query("""
        select cm
        from ConversationMember cm
        where cm.conversation.id = :conversationId
          and cm.user.id = :userId
          and cm.deletedAt is null
          and cm.conversation.deletedAt is null
        """)
    Optional<ConversationMember> findByConversationIdAndUserId(
        @Param("conversationId") Long conversationId,
        @Param("userId") Long userId
    );

    @Query("""
        select cm
        from ConversationMember cm
        where cm.conversation.id = :conversationId
          and cm.deletedAt is null
          and cm.conversation.deletedAt is null
        order by cm.createdAt asc
        """)
    List<ConversationMember> findByConversationId(@Param("conversationId") Long conversationId);

    @Query("""
        select cm1.conversation.id
        from ConversationMember cm1
        join ConversationMember cm2 on cm1.conversation.id = cm2.conversation.id
        where cm1.user.id = :userId1
          and cm2.user.id = :userId2
          and cm1.deletedAt is null
          and cm2.deletedAt is null
          and cm1.conversation.deletedAt is null
          and (
              select count(cm3.id)
              from ConversationMember cm3
              where cm3.conversation.id = cm1.conversation.id
                and cm3.deletedAt is null
          ) = 2
        order by coalesce(cm1.conversation.updatedAt, cm1.conversation.createdAt) desc
        """)
    List<Long> findConversationIdBetween(@Param("userId1") Long userId1, @Param("userId2") Long userId2);
}
