package com.vtechai.vcollab.feed;

import com.vtechai.vcollab.feed.dto.FeedResponse;
import com.vtechai.vcollab.security.UserPrincipal;

public interface FeedService {
    FeedResponse getFeed(UserPrincipal principal, FeedScope scope, int size, boolean includeSchool);
}
