package com.vtechai.vcollab.warning;

import com.vtechai.vcollab.enums.WarningStatus;
import com.vtechai.vcollab.security.UserPrincipal;
import com.vtechai.vcollab.warning.dto.WarningCreateRequest;
import com.vtechai.vcollab.warning.dto.WarningResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface WarningService {
    WarningResponse create(WarningCreateRequest request, UserPrincipal admin);
    Page<WarningResponse> listAll(WarningStatus status, boolean deleted, Pageable pageable);
    Page<WarningResponse> listMine(UserPrincipal principal, Pageable pageable);
    WarningResponse acknowledge(Long id, UserPrincipal principal);
    void delete(Long id, UserPrincipal principal);
}
