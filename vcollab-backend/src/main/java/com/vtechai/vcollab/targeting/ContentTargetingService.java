package com.vtechai.vcollab.targeting;

import com.vtechai.vcollab.enums.ContentType;
import com.vtechai.vcollab.targeting.dto.ContentTargetingRequest;
import com.vtechai.vcollab.targeting.dto.ContentTargetingResponse;
import java.util.Optional;

public interface ContentTargetingService {
    ContentTargetingResponse upsert(ContentTargetingRequest request);
    Optional<ContentTargetingResponse> findByContent(Long contentId, ContentType contentType);
    void remove(Long contentId, ContentType contentType);
}
