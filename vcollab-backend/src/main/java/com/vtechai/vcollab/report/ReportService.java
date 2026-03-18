package com.vtechai.vcollab.report;

import com.vtechai.vcollab.enums.ReportStatus;
import com.vtechai.vcollab.report.dto.ReportCreateRequest;
import com.vtechai.vcollab.report.dto.ReportResponse;
import com.vtechai.vcollab.report.dto.ReportStatusUpdate;
import com.vtechai.vcollab.security.UserPrincipal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ReportService {
    ReportResponse create(ReportCreateRequest request, UserPrincipal principal);
    Page<ReportResponse> listMine(UserPrincipal principal, Pageable pageable);
    Page<ReportResponse> listAll(ReportStatus status, boolean deleted, Pageable pageable);
    ReportResponse updateStatus(Long id, ReportStatusUpdate request, UserPrincipal admin);
    void delete(Long id, UserPrincipal principal);
}
