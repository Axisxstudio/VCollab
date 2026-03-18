package com.vtechai.vcollab.audit.entity;

import com.vtechai.vcollab.common.BaseEntity;
import com.vtechai.vcollab.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
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
@Table(name = "audit_logs")
public class AuditLog extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_id")
    private User actor;

    @Column(name = "module_name", nullable = false, length = 100)
    private String moduleName;

    @Column(name = "action_name", nullable = false, length = 100)
    private String actionName;

    @Column(name = "target_type", length = 100)
    private String targetType;

    @Column(name = "target_id")
    private Long targetId;

    @Column(name = "summary", length = 500)
    private String summary;

    @Column(name = "metadata", columnDefinition = "TEXT")
    private String metadata;
}
