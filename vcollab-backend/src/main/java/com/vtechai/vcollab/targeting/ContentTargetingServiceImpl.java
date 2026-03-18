package com.vtechai.vcollab.targeting;

import com.vtechai.vcollab.enums.ContentType;
import com.vtechai.vcollab.targeting.dto.ContentTargetingRequest;
import com.vtechai.vcollab.targeting.dto.ContentTargetingResponse;
import com.vtechai.vcollab.targeting.entity.ContentTargeting;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ContentTargetingServiceImpl implements ContentTargetingService {

    private final ContentTargetingRepository targetingRepository;

    @Override
    @Transactional
    public ContentTargetingResponse upsert(ContentTargetingRequest request) {
        ContentTargeting targeting = targetingRepository
            .findByContentIdAndContentType(request.getContentId(), request.getContentType())
            .orElse(ContentTargeting.builder()
                .contentId(request.getContentId())
                .contentType(request.getContentType())
                .build());

        targeting.setTargetType(request.getTargetType() != null ? request.getTargetType() : targeting.getTargetType());
        targeting.setGrade(request.getGrade());
        targeting.setAcademicYear(request.getAcademicYear());
        targeting.setSemester(request.getSemester());
        targeting.setFaculty(request.getFaculty());
        targeting.setInstitutionName(request.getInstitutionName());

        targeting = targetingRepository.save(targeting);
        return toResponse(targeting);
    }

    @Override
    public Optional<ContentTargetingResponse> findByContent(Long contentId, ContentType contentType) {
        return targetingRepository.findByContentIdAndContentType(contentId, contentType)
            .map(this::toResponse);
    }

    @Override
    @Transactional
    public void remove(Long contentId, ContentType contentType) {
        targetingRepository.deleteByContentIdAndContentType(contentId, contentType);
    }

    private ContentTargetingResponse toResponse(ContentTargeting t) {
        return ContentTargetingResponse.builder()
            .id(t.getId())
            .contentId(t.getContentId())
            .contentType(t.getContentType())
            .targetType(t.getTargetType())
            .grade(t.getGrade())
            .academicYear(t.getAcademicYear())
            .semester(t.getSemester())
            .faculty(t.getFaculty())
            .institutionName(t.getInstitutionName())
            .build();
    }
}
