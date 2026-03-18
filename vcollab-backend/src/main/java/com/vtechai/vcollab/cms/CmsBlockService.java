package com.vtechai.vcollab.cms;

import com.vtechai.vcollab.cms.dto.CmsBlockRequest;
import com.vtechai.vcollab.cms.dto.CmsBlockResponse;
import com.vtechai.vcollab.security.UserPrincipal;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface CmsBlockService {
    Page<CmsBlockResponse> listAdmin(String sectionKey, Boolean active, Boolean publicVisible, String search, Pageable pageable);
    CmsBlockResponse create(CmsBlockRequest request, UserPrincipal principal);
    CmsBlockResponse update(Long id, CmsBlockRequest request, UserPrincipal principal);
    List<CmsBlockResponse> listPublic(String sectionKey);
}
