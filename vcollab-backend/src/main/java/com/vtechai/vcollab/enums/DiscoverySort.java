package com.vtechai.vcollab.enums;

import org.springframework.data.domain.Sort;

public enum DiscoverySort {
    NEWEST,
    OLDEST,
    MOST_LIKED,
    MOST_COMMENTED,
    RECENTLY_UPDATED;

    public Sort toSort() {
        if (this == OLDEST) {
            return Sort.by(Sort.Direction.ASC, "createdAt");
        }
        if (this == MOST_LIKED) {
            return Sort.by(Sort.Direction.DESC, "likeCount")
                .and(Sort.by(Sort.Direction.DESC, "createdAt"));
        }
        if (this == MOST_COMMENTED) {
            return Sort.by(Sort.Direction.DESC, "commentCount")
                .and(Sort.by(Sort.Direction.DESC, "createdAt"));
        }
        if (this == RECENTLY_UPDATED) {
            return Sort.by(Sort.Direction.DESC, "updatedAt")
                .and(Sort.by(Sort.Direction.DESC, "createdAt"));
        }
        return Sort.by(Sort.Direction.DESC, "createdAt");
    }
}
