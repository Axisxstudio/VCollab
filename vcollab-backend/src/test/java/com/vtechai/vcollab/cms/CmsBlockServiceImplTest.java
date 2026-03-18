package com.vtechai.vcollab.cms;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.vtechai.vcollab.audit.AuditLogService;
import com.vtechai.vcollab.cms.dto.CmsBlockRequest;
import com.vtechai.vcollab.cms.dto.CmsBlockResponse;
import com.vtechai.vcollab.cms.entity.CmsBlock;
import com.vtechai.vcollab.enums.Role;
import com.vtechai.vcollab.security.UserPrincipal;
import com.vtechai.vcollab.user.entity.User;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CmsBlockServiceImplTest {
    @Mock
    private CmsBlockRepository cmsBlockRepository;
    @Mock
    private AuditLogService auditLogService;
    @Captor
    private ArgumentCaptor<CmsBlock> blockCaptor;

    private CmsBlockServiceImpl cmsBlockService;
    private UserPrincipal principal;

    @BeforeEach
    void setUp() {
        cmsBlockService = new CmsBlockServiceImpl(cmsBlockRepository, auditLogService);
        principal = UserPrincipal.fromUser(
            User.builder()
                .id(77L)
                .email("admin@vcollab.test")
                .username("super-admin")
                .passwordHash("hashed")
                .role(Role.SUPER_ADMIN)
                .active(true)
                .suspended(false)
                .build()
        );
    }

    @Test
    void createNormalizesSectionKeyAndRecordsAudit() {
        CmsBlockRequest request = new CmsBlockRequest();
        request.setSectionKey("landing info");
        request.setTitle("Student benefits");
        request.setSubtitle("Everything in one place");
        request.setBody("Body copy");
        request.setBadge("Platform note");
        request.setCtaLabel("Join");
        request.setCtaUrl("/register");
        request.setThemeTone("brand");
        request.setDisplayOrder(2);
        request.setActive(true);
        request.setPublicVisible(true);

        when(cmsBlockRepository.save(any(CmsBlock.class))).thenAnswer(invocation -> {
            CmsBlock block = invocation.getArgument(0);
            block.setId(15L);
            return block;
        });

        CmsBlockResponse response = cmsBlockService.create(request, principal);

        verify(cmsBlockRepository).save(blockCaptor.capture());
        CmsBlock saved = blockCaptor.getValue();
        assertThat(saved.getSectionKey()).isEqualTo("LANDING_INFO");
        assertThat(saved.getTitle()).isEqualTo("Student benefits");
        assertThat(response.getId()).isEqualTo(15L);
        verify(auditLogService).record(
            eq(77L),
            eq("CMS_BLOCK"),
            eq("CREATED"),
            eq("CMS_BLOCK"),
            eq(15L),
            eq("Created CMS block Student benefits"),
            eq("sectionKey=LANDING_INFO")
        );
    }

    @Test
    void updateUsesToggleAuditWhenVisibilityChanges() {
        CmsBlock existing = CmsBlock.builder()
            .id(21L)
            .sectionKey("LANDING_INFO")
            .title("Existing block")
            .body("Existing body")
            .displayOrder(0)
            .active(true)
            .publicVisible(true)
            .build();

        CmsBlockRequest request = new CmsBlockRequest();
        request.setSectionKey("landing info");
        request.setTitle("Existing block");
        request.setSubtitle("Updated subtitle");
        request.setBody("Updated body");
        request.setBadge("");
        request.setCtaLabel("");
        request.setCtaUrl("");
        request.setThemeTone("brand");
        request.setDisplayOrder(1);
        request.setActive(false);
        request.setPublicVisible(true);

        when(cmsBlockRepository.findById(21L)).thenReturn(Optional.of(existing));
        when(cmsBlockRepository.save(any(CmsBlock.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CmsBlockResponse response = cmsBlockService.update(21L, request, principal);

        assertThat(response.isActive()).isFalse();
        assertThat(response.getDisplayOrder()).isEqualTo(1);
        verify(auditLogService).record(
            eq(77L),
            eq("CMS_BLOCK"),
            eq("TOGGLED"),
            eq("CMS_BLOCK"),
            eq(21L),
            eq("Updated visibility for Existing block"),
            eq("sectionKey=LANDING_INFO, active=false, publicVisible=true")
        );
    }
}
