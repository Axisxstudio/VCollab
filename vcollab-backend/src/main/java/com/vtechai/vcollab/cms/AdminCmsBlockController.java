package com.vtechai.vcollab.cms;

import com.vtechai.vcollab.cms.dto.CmsBlockRequest;
import com.vtechai.vcollab.cms.dto.CmsBlockResponse;
import com.vtechai.vcollab.common.ApiResponse;
import com.vtechai.vcollab.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/cms-blocks")
@RequiredArgsConstructor
public class AdminCmsBlockController {
    private final CmsBlockService cmsBlockService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<CmsBlockResponse>>> list(
        @RequestParam(value = "sectionKey", required = false) String sectionKey,
        @RequestParam(value = "active", required = false) Boolean active,
        @RequestParam(value = "publicVisible", required = false) Boolean publicVisible,
        @RequestParam(value = "search", required = false) String search,
        Pageable pageable
    ) {
        Page<CmsBlockResponse> response = cmsBlockService.listAdmin(sectionKey, active, publicVisible, search, pageable);
        return ResponseEntity.ok(ApiResponse.ok("CMS blocks", response));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CmsBlockResponse>> create(
        @Valid @RequestBody CmsBlockRequest request,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        CmsBlockResponse response = cmsBlockService.create(request, principal);
        return ResponseEntity.ok(ApiResponse.ok("CMS block created", response));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<CmsBlockResponse>> update(
        @PathVariable Long id,
        @Valid @RequestBody CmsBlockRequest request,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        CmsBlockResponse response = cmsBlockService.update(id, request, principal);
        return ResponseEntity.ok(ApiResponse.ok("CMS block updated", response));
    }
}
