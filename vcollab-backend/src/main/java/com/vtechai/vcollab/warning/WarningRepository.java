package com.vtechai.vcollab.warning;

import com.vtechai.vcollab.enums.WarningStatus;
import com.vtechai.vcollab.warning.entity.Warning;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WarningRepository extends JpaRepository<Warning, Long> {
    long countByStatusAndDeletedAtIsNull(WarningStatus status);
    Page<Warning> findByDeletedAtIsNull(Pageable pageable);
    Page<Warning> findByStatusAndDeletedAtIsNull(WarningStatus status, Pageable pageable);
    Page<Warning> findByTargetUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(Long userId, Pageable pageable);
    Page<Warning> findByDeletedAtIsNotNullOrderByDeletedAtDesc(Pageable pageable);
    Optional<Warning> findByIdAndDeletedAtIsNull(Long id);
}
