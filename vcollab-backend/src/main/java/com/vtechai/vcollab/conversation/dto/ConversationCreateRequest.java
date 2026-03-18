package com.vtechai.vcollab.conversation.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ConversationCreateRequest {
    @NotNull
    private Long userId;
}
