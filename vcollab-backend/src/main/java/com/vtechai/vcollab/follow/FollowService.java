package com.vtechai.vcollab.follow;

import com.vtechai.vcollab.follow.dto.FollowRequest;
import com.vtechai.vcollab.follow.dto.FollowUserResponse;
import com.vtechai.vcollab.security.UserPrincipal;
import java.util.List;

public interface FollowService {
    void follow(FollowRequest request, UserPrincipal principal);
    void unfollow(Long userId, UserPrincipal principal);
    boolean isFollowing(Long userId, UserPrincipal principal);
    List<FollowUserResponse> listFollowers(Long userId);
    List<FollowUserResponse> listFollowing(Long userId);
}
