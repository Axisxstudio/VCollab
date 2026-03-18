package com.vtechai.vcollab.project;

import com.vtechai.vcollab.enums.DiscoverySort;
import com.vtechai.vcollab.project.dto.ProjectRequestDto;
import com.vtechai.vcollab.project.dto.ProjectResponse;
import com.vtechai.vcollab.security.UserPrincipal;
import java.time.LocalDate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ProjectService {
    Page<ProjectResponse> listPublic(Pageable pageable);
    Page<ProjectResponse> searchPublic(
        String search,
        Long categoryId,
        String tag,
        String owner,
        LocalDate fromDate,
        LocalDate toDate,
        DiscoverySort sort,
        Pageable pageable
    );
    Page<ProjectResponse> listByUsername(String username, UserPrincipal principal, Pageable pageable);
    ProjectResponse getById(Long id, UserPrincipal principal);
    ProjectResponse create(ProjectRequestDto request, UserPrincipal principal);
    ProjectResponse update(Long id, ProjectRequestDto request, UserPrincipal principal);
    void softDelete(Long id, UserPrincipal principal);
}
