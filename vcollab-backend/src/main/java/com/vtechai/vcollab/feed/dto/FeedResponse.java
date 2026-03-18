package com.vtechai.vcollab.feed.dto;

import com.vtechai.vcollab.feed.FeedScope;
import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FeedResponse {
    private FeedScope scope;
    private int requestedSize;
    private int itemCount;
    private long followingCount;
    private long personalizedItemCount;
    private FeedStats stats;
    private List<FeedItemResponse> items;

    @Data
    @Builder
    public static class FeedStats {
        private int projectCount;
        private int postCount;
        private int blogCount;
    }
}
