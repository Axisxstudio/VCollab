package com.vtechai.vcollab.share;

import com.vtechai.vcollab.share.dto.ShareRequest;
import com.vtechai.vcollab.security.UserPrincipal;

public interface ShareService {
    void share(ShareRequest request, UserPrincipal principal);
}
