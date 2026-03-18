package com.vtechai.vcollab.audit;

import com.vtechai.vcollab.audit.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    @Query("""
        select log from AuditLog log
        left join log.actor actor
        left join actor.profile profile
        where (:module is null or lower(log.moduleName) = lower(:module))
          and (:action is null or lower(log.actionName) = lower(:action))
          and (
            :search is null
            or lower(coalesce(log.summary, '')) like lower(concat('%', :search, '%'))
            or lower(coalesce(log.targetType, '')) like lower(concat('%', :search, '%'))
            or lower(coalesce(actor.username, '')) like lower(concat('%', :search, '%'))
            or lower(coalesce(profile.fullName, '')) like lower(concat('%', :search, '%'))
          )
        """)
    Page<AuditLog> search(
        @Param("module") String module,
        @Param("action") String action,
        @Param("search") String search,
        Pageable pageable
    );
}
