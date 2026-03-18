package com.vtechai.vcollab.cms;

import com.vtechai.vcollab.audit.AuditLogService;
import com.vtechai.vcollab.cms.dto.CmsBlockRequest;
import com.vtechai.vcollab.cms.dto.CmsBlockResponse;
import com.vtechai.vcollab.cms.entity.CmsBlock;
import com.vtechai.vcollab.exception.ResourceNotFoundException;
import com.vtechai.vcollab.security.UserPrincipal;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class CmsBlockServiceImpl implements CmsBlockService {
    private final CmsBlockRepository cmsBlockRepository;
    private final AuditLogService auditLogService;

    @Override
    @Transactional(readOnly = true)
    public Page<CmsBlockResponse> listAdmin(String sectionKey, Boolean active, Boolean publicVisible, String search, Pageable pageable) {
        return cmsBlockRepository
            .searchAdmin(trimToNull(sectionKey), active, publicVisible, trimToNull(search), pageable)
            .map(this::mapToResponse);
    }

    @Override
    public CmsBlockResponse create(CmsBlockRequest request, UserPrincipal principal) {
        CmsBlock block = CmsBlock.builder()
            .sectionKey(normalize(request.getSectionKey()))
            .title(request.getTitle().trim())
            .subtitle(trimToNull(request.getSubtitle()))
            .body(request.getBody().trim())
            .badge(trimToNull(request.getBadge()))
            .ctaLabel(trimToNull(request.getCtaLabel()))
            .ctaUrl(trimToNull(request.getCtaUrl()))
            .themeTone(trimToNull(request.getThemeTone()))
            .displayOrder(request.getDisplayOrder())
            .active(Boolean.TRUE.equals(request.getActive()))
            .publicVisible(Boolean.TRUE.equals(request.getPublicVisible()))
            .build();

        CmsBlock saved = cmsBlockRepository.save(block);
        auditLogService.record(
            principal.getId(),
            "CMS_BLOCK",
            "CREATED",
            "CMS_BLOCK",
            saved.getId(),
            "Created CMS block " + saved.getTitle(),
            "sectionKey=" + saved.getSectionKey()
        );
        return mapToResponse(saved);
    }

    @Override
    public CmsBlockResponse update(Long id, CmsBlockRequest request, UserPrincipal principal) {
        CmsBlock block = cmsBlockRepository.findById(id)
            .filter(item -> item.getDeletedAt() == null)
            .orElseThrow(() -> new ResourceNotFoundException("CMS block not found"));

        boolean statusChanged = block.isActive() != Boolean.TRUE.equals(request.getActive())
            || block.isPublicVisible() != Boolean.TRUE.equals(request.getPublicVisible());

        block.setSectionKey(normalize(request.getSectionKey()));
        block.setTitle(request.getTitle().trim());
        block.setSubtitle(trimToNull(request.getSubtitle()));
        block.setBody(request.getBody().trim());
        block.setBadge(trimToNull(request.getBadge()));
        block.setCtaLabel(trimToNull(request.getCtaLabel()));
        block.setCtaUrl(trimToNull(request.getCtaUrl()));
        block.setThemeTone(trimToNull(request.getThemeTone()));
        block.setDisplayOrder(request.getDisplayOrder());
        block.setActive(Boolean.TRUE.equals(request.getActive()));
        block.setPublicVisible(Boolean.TRUE.equals(request.getPublicVisible()));

        CmsBlock saved = cmsBlockRepository.save(block);
        auditLogService.record(
            principal.getId(),
            "CMS_BLOCK",
            statusChanged ? "TOGGLED" : "UPDATED",
            "CMS_BLOCK",
            saved.getId(),
            (statusChanged ? "Updated visibility for " : "Updated CMS block ") + saved.getTitle(),
            "sectionKey=" + saved.getSectionKey()
                + ", active=" + saved.isActive()
                + ", publicVisible=" + saved.isPublicVisible()
        );
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CmsBlockResponse> listPublic(String sectionKey) {
        return cmsBlockRepository.listPublic(trimToNull(sectionKey)).stream()
            .map(this::mapToResponse)
            .toList();
    }

    private CmsBlockResponse mapToResponse(CmsBlock block) {
        return CmsBlockResponse.builder()
            .id(block.getId())
            .sectionKey(block.getSectionKey())
            .title(block.getTitle())
            .subtitle(block.getSubtitle())
            .body(block.getBody())
            .badge(block.getBadge())
            .ctaLabel(block.getCtaLabel())
            .ctaUrl(block.getCtaUrl())
            .themeTone(block.getThemeTone())
            .displayOrder(block.getDisplayOrder())
            .active(block.isActive())
            .publicVisible(block.isPublicVisible())
            .createdAt(block.getCreatedAt())
            .updatedAt(block.getUpdatedAt())
            .build();
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String normalize(String value) {
        return value.trim().toUpperCase().replace(' ', '_');
    }
}
