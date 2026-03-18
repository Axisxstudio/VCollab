package com.vtechai.vcollab.save;

import com.vtechai.vcollab.enums.ContentType;
import com.vtechai.vcollab.save.dto.SavedContentResponse;
import com.vtechai.vcollab.save.dto.SaveRequest;
import com.vtechai.vcollab.security.UserPrincipal;

public interface SaveService {
    void save(SaveRequest request, UserPrincipal principal);
    void unsave(ContentType contentType, Long contentId, UserPrincipal principal);
    boolean isSaved(ContentType contentType, Long contentId, UserPrincipal principal);
    SavedContentResponse listSaved(UserPrincipal principal);
}
