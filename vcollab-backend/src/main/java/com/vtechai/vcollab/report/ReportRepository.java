package com.vtechai.vcollab.report;

import com.vtechai.vcollab.enums.ReportStatus;
import com.vtechai.vcollab.report.entity.Report;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReportRepository extends JpaRepository<Report, Long> {
    long countByStatusAndDeletedAtIsNull(ReportStatus status);
    Page<Report> findByDeletedAtIsNull(Pageable pageable);
    Page<Report> findByReporterIdAndDeletedAtIsNullOrderByCreatedAtDesc(Long reporterId, Pageable pageable);
    Page<Report> findByStatusAndDeletedAtIsNull(ReportStatus status, Pageable pageable);
    Page<Report> findByDeletedAtIsNotNullOrderByDeletedAtDesc(Pageable pageable);
    Optional<Report> findByIdAndDeletedAtIsNull(Long id);
}
