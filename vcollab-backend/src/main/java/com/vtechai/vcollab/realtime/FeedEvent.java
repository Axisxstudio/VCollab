package com.vtechai.vcollab.realtime;

import com.vtechai.vcollab.enums.ContentType;
import com.vtechai.vcollab.enums.FeedEventType;
import java.time.Instant;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FeedEvent {
    private FeedEventType eventType;
    private ContentType contentType;
    private Long contentId;
    private Long actorId;
    private String actorName;
    private Instant createdAt;
}
